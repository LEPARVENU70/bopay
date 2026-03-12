import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';

const TOKEN_KEY = 'bopay_access_token';

export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token);
export const getToken = () => SecureStore.getItemAsync(TOKEN_KEY);
export const deleteToken = () => SecureStore.deleteItemAsync(TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),
};

// Auth
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) =>
    api.post<{ accessToken: string; user: any }>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: any }>('/auth/login', { email, password }),

  me: () => api.get<any>('/auth/me'),

  refresh: () => api.post<{ accessToken: string; user: any }>('/auth/refresh', {}),
};

// Merchants
export const merchantsApi = {
  create: (data: { businessName: string; email: string; phone?: string; siret?: string }) =>
    api.post<{ merchant: any; onboardingUrl: string }>('/merchants', data),

  me: () => api.get<any>('/merchants/me'),

  onboardingStatus: () => api.get<any>('/merchants/me/onboarding-status'),

  connectionToken: () => api.post<{ secret: string }>('/merchants/me/connection-token', {}),
};

// Payments
export const paymentsApi = {
  createIntent: (data: { amount: number; description?: string; customerId?: string; idempotencyKey?: string }) =>
    api.post<{ paymentIntentClientSecret: string; paymentId: string; paymentIntentId: string }>('/payments/intent', data),

  list: (page = 1) => api.get<any>(`/payments?page=${page}`),

  get: (id: string) => api.get<any>(`/payments/${id}`),

  sendInvoice: (paymentId: string, email: string) =>
    api.post<{ success: boolean; email: string }>(`/payments/${paymentId}/send-invoice`, { email }),
};

// Customers
export const customersApi = {
  list: (page = 1) => api.get<any>(`/customers?page=${page}`),
  get: (id: string) => api.get<any>(`/customers/${id}`),
};
