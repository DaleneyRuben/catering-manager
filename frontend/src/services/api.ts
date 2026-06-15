import { API_BASE } from '../utils/env';

const BASE = API_BASE;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const errBody = await res.clone().json();
      if (typeof errBody?.message === 'string') message = errBody.message;
      else if (typeof errBody?.error === 'string') message = errBody.error;
    } catch {
      // ignore — fall back to status code message
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json();
  return (json as { data: T }).data;
}

async function requestPaginated<T>(url: string): Promise<PaginatedResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
  });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return res.json();
}

const api = {
  get: <T>(url: string) => request<T>('GET', url),
  getPaginated: <T>(url: string) => requestPaginated<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: (url: string) => request<void>('DELETE', url),
};

export default api;
