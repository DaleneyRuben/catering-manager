import { API_BASE } from '../utils/env';

const BASE = API_BASE;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`);
  if (res.status === 204) return undefined as unknown as T;

  const json = await res.json();
  return (json as { data: T }).data;
}

async function requestPaginated<T>(url: string): Promise<PaginatedResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
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
