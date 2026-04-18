import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`
});

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('urben-auth') || 'null');
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`;
  return config;
});

export default api;
