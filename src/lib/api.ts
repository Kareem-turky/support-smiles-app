import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '@/services/storage';

import { mockApiAdapter } from './mockApiAdapter';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// Force real API to avoid environment configuration confusion
const USE_MOCK = false;

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Mock API Interceptor
if (USE_MOCK) {
    api.interceptors.request.use(async (config) => {
        // Skip real request and return mock response
        try {
            const response = await mockApiAdapter.request(config);
            return Promise.reject({
                config,
                response,
                __isMockResponse: true
            });
        } catch (error) {
            return Promise.reject(error);
        }
    });

    // Handle the mock response in response interceptor
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.__isMockResponse) {
                return Promise.resolve(error.response);
            }
            return Promise.reject(error);
        }
    );
}

// Request Interceptor: Attach Token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Handle Errors & Refresh Token
api.interceptors.response.use(
    (response) => response,
    async (error: any) => {
        const originalRequest = error?.config;

        if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            if (originalRequest) {
                originalRequest._retry = true;
            }
            isRefreshing = true;

            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
                isRefreshing = false;
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });
                const { access_token, refresh_token: newRefreshToken } = data.data || data;

                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
                if (originalRequest && originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                processQueue(null, access_token);
                if (originalRequest) {
                    return api(originalRequest);
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response) {
            // Normalize error message
            const data = error.response.data as any;
            const message = data.message || error.message || 'An unexpected error occurred';
            const errorMsg = Array.isArray(message) ? message.join(', ') : message;

            return Promise.reject(new Error(errorMsg));
        }
        return Promise.reject(error);
    }
);
