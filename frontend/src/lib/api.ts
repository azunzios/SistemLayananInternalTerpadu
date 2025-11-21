// Centralized API helper for Vite + React
// Uses base URL from import.meta.env.VITE_API

const rawBase = (import.meta.env.VITE_API as string | undefined) || '';
export const API_BASE_URL = rawBase.replace(/\/$/, '');

function isAbsolute(url: string) {
  return /^https?:\/\//i.test(url);
}

export function resolveApiUrl(path: string): string {
  if (isAbsolute(path)) return path;
  const cleanPath = path.replace(/^\//, '');
  if (!API_BASE_URL) return `/${cleanPath}`;
  return `${API_BASE_URL}/${cleanPath}`;
}

export type ApiError = Error & { status?: number; body?: unknown };

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => undefined) : await res.text();
  if (!res.ok) {
    const err: ApiError = Object.assign(new Error('Request failed'), {
      status: res.status,
      body: data,
    });
    throw err;
  }
  return data as T;
}

export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = resolveApiUrl(path);
  const headers = new Headers(init?.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  // Ensure JSON is parsed by Laravel: set Content-Type whenever there is a body (except FormData)
  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add auth token if available
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('auth_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutMs = Number(import.meta.env.VITE_API_TIMEOUT || 0);
  let timer: number | undefined;
  if (timeoutMs > 0) {
    // @ts-ignore - Node vs DOM typings; runtime is browser
    timer = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
      credentials: 'include',
    });
    return await handleResponse<T>(res);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const api = {
  get: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'POST',
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'PUT',
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    }),
  patch: <T = unknown>(path: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(path, {
      ...init,
      method: 'PATCH',
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    }),
  delete: <T = unknown>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'DELETE' }),
};
