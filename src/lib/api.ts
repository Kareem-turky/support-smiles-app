import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { STORAGE_KEYS } from '../services/storage';
import { mockApiAdapter } from './mockApiAdapter';

// Check if mock mode is enabled
const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001';

if (useMockApi) {
    console.log('[API] Running in MOCK MODE - no backend required');
} else {
    console.log('[API] Running in REAL MODE - API_BASE_URL=', baseURL);
}

// Diagnostic: Log all outgoing requests
const logRequest = (method: string, url: string) => {
    console.log(`[API Request] ${method.toUpperCase()} ${url}`);
};

// Create axios instance for real API calls
const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth interceptor for real API
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 for real API
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (!error.config.url.includes('/auth/login')) {
                console.warn('[API] 401 received. Clearing session.');
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Unified API interface that works with both mock and real backends
export const api = {
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        logRequest('GET', url);
        if (useMockApi) {
            return mockApiAdapter.request({ method: 'GET', url, params: config?.params }) as Promise<AxiosResponse<T>>;
        }
        return axiosInstance.get<T>(url, config);
    },

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        logRequest('POST', url);
        if (useMockApi) {
            return mockApiAdapter.request({ method: 'POST', url, data }) as Promise<AxiosResponse<T>>;
        }
        return axiosInstance.post<T>(url, data, config);
    },

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        logRequest('PUT', url);
        if (useMockApi) {
            return mockApiAdapter.request({ method: 'PUT', url, data }) as Promise<AxiosResponse<T>>;
        }
        return axiosInstance.put<T>(url, data, config);
    },

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        logRequest('PATCH', url);
        if (useMockApi) {
            return mockApiAdapter.request({ method: 'PATCH', url, data }) as Promise<AxiosResponse<T>>;
        }
        return axiosInstance.patch<T>(url, data, config);
    },

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
        logRequest('DELETE', url);
        if (useMockApi) {
            return mockApiAdapter.request({ method: 'DELETE', url }) as Promise<AxiosResponse<T>>;
        }
        return axiosInstance.delete<T>(url, config);
    },
};
