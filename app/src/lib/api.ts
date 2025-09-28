import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (username: string, password: string) => {
  const { data } = await api.post('/auth/login', { username, password });
  localStorage.setItem('token', data.token);
  return data;
};

export const fetchPeople = async (params?: Record<string, string>) => {
  const { data } = await api.get('/people', { params });
  return data.data;
};

export const createPerson = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/people', payload);
  return data;
};

export const fetchStatusNow = async (unit?: string) => {
  const { data } = await api.get('/status/now', { params: unit ? { unit } : undefined });
  return data.data;
};

export const fetchStatusHistory = async (personId: string) => {
  const { data } = await api.get('/status/history', { params: { person_id: personId } });
  return data.data;
};

export const postPresenceEvent = async (payload: Record<string, unknown>) => {
  const { data } = await api.post('/events/presence', payload);
  return data;
};

export const fetchAudit = async (personId: string) => {
  const { data } = await api.get(`/audit/${personId}`);
  return data.data;
};

export const fetchKpi = async (params?: Record<string, string>) => {
  const { data } = await api.get('/reports/kpi', { params });
  return data.totals;
};

export const fetchHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;
