'use client';

const BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'ombor_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function qs(params) {
  if (!params) return '';
  const s = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return s ? `?${s}` : '';
}

async function request(method, path, body, params) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${BASE}/api${path}${qs(params)}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Internet yoki server bilan aloqa yo\'q', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/login') {
      setToken(null);
      window.dispatchEvent(new Event('ombor:logout'));
    }
    throw new ApiError(data.message || 'Xatolik yuz berdi', res.status);
  }
  return data;
}

export const api = {
  get: (path, params) => request('GET', path, null, params),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
};
