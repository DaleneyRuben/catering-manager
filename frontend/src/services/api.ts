const BASE = import.meta.env.VITE_API_URL || '/api';

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

const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body),
  delete: (url: string) => request<void>('DELETE', url),
};

export default api;
