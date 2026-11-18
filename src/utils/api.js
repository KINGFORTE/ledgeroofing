export const API_BASE = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')
).replace(/\/$/, '');
export const API_CONFIGURED = Boolean(import.meta.env.VITE_API_URL) || import.meta.env.DEV;

export async function apiRequest(path, options = {}) {
  if (!API_CONFIGURED) throw new Error('The staff API is not configured yet. Set VITE_API_URL in Vercel after deploying the Hostinger service.');
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

export function assetUrl(value) {
  if (!value || !value.startsWith('/uploads/')) return value;
  const origin = API_BASE.replace(/\/api$/, '');
  return `${origin}${value}`;
}
