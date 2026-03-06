import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://control.html-builder.net';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  },
);

export const extractErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const maybeMessage =
      (error.response?.data as { message?: string } | undefined)?.message || error.message;
    return maybeMessage || 'Request failed';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error occurred';
};
