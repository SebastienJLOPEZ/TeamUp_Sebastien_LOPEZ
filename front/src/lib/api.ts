import axios from 'axios';
import { fetchTokens, removeTokens, refreshAccessToken } from './auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config) => {
        const tokens = fetchTokens();
        if (tokens?.token) {
            config.headers['Authorization'] = `Bearer ${tokens.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                removeTokens();
                setTimeout(() => {
                    window.location.href = '/login';
                }, 2 * 60 * 1000); // 2 minutes
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;