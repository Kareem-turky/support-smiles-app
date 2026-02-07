import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '@/services/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach Token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response Interceptor: Handle Errors
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response) {
            // Handle 401 Unauthorized -> Logout
            if (error.response.status === 401) {
                localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
                window.location.href = '/login';
            }

            // Normalize error message
            const data = error.response.data as any;
            const message = data.message || error.message || 'An unexpected error occurred';

            // Use a custom property to pass the clear message to UI
            return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
        }
        return Promise.reject(error);
    }
);
