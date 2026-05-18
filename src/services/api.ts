import axios from 'axios';

// Prod: FORCE same-origin (Vercel proxy /api/* → BE) — bỏ qua VITE_API_URL để tránh
// trường hợp Vercel project env var trỏ thẳng HTTP BE gây mixed-content.
// Dev: dùng VITE_API_URL (vd https://localhost:7198) hoặc fallback.
const baseURL = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_URL || 'https://localhost:7198');

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Không refresh cho các endpoint auth — nếu 401 ở đây là lỗi login thật,
// phải để propagate nguyên vẹn cho UI hiển thị message từ BE.
const isAuthEndpoint = (url?: string) =>
  !!url && (url.includes('/api/auth/google') || url.includes('/api/auth/refresh'));

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${api.defaults.baseURL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const { accessToken } = res.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
