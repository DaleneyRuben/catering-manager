const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T = unknown>(
  method: string,
  url: string,
  body?: unknown,
): Promise<{ data: T }> {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`);
  if (res.status === 204) return { data: null as T };

  const json = await res.json();
  return { data: json };
}

const api = {
  get: (url: string) => request('GET', url),
  post: (url: string, body?: unknown) => request('POST', url, body),
  patch: (url: string, body?: unknown) => request('PATCH', url, body),
  delete: (url: string) => request('DELETE', url),
};

export default api;
