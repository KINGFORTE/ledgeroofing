export const API_BASE = (
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/api')
).replace(/\/$/, '');
export const API_CONFIGURED = Boolean(import.meta.env.VITE_API_URL) || import.meta.env.DEV;

const DEFAULT_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;
const inFlight = new Map();
let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, { status = 0, code = '', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dispatchAuthExpired() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('ledge:auth-expired', { detail: { reason: 'session_expired' } }));
}

function isAbortError(error) {
  return error?.name === 'AbortError';
}

function isNetworkError(error) {
  return !error?.status && !isAbortError(error) && !(error instanceof ApiError);
}

function requestKey(path, options) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body instanceof FormData ? 'form-data' : (options.body || '');
  return `${method} ${path} ${typeof body === 'string' ? body.slice(0, 512) : ''}`;
}

export async function refreshSession({ silent = false } = {}) {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Refresh rejected.');
        return response.json().catch(() => ({}));
      })
      .catch(() => {
        // Boot-time /auth/me has its own error path. Avoid dispatching a global
        // logout event before the app shell has mounted its listener.
        if (!silent) dispatchAuthExpired();
        throw new ApiError('Your session expired. Sign in again.', { status: 401, code: 'SESSION_EXPIRED' });
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function fetchWithTimeout(path, options, timeoutMs) {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => controller.abort();

  if (options.signal) {
    if (options.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    options.signal.addEventListener('abort', onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const isForm = options.body instanceof FormData;
    return await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        ...(isForm || options.body == null ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
  } catch (error) {
    if (timedOut && !isAbortError(error)) {
      throw new ApiError('The request timed out. Check your connection and try again.', { code: 'TIMEOUT' });
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener?.('abort', onExternalAbort);
  }
}

async function parseResponse(response, responseType) {
  if (response.status === 204) return null;
  if (responseType === 'blob') {
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new ApiError(data.error || `Request failed (${response.status}).`, { status: response.status, code: data.code || '' });
    }
    return response.blob();
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status}).`, {
      status: response.status,
      code: data.code || '',
      details: data.details || null,
    });
  }
  return data;
}

async function perform(path, options, { allowRefresh = true } = {}) {
  if (!API_CONFIGURED) {
    throw new ApiError('The staff API is not configured yet. Set VITE_API_URL in Vercel after deploying the Hostinger service.', { code: 'API_NOT_CONFIGURED' });
  }
  const method = (options.method || 'GET').toUpperCase();
  const retryable = method === 'GET' || method === 'HEAD';
  const timeoutMs = Number(options.timeout) || DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchWithTimeout(path, options, timeoutMs);
      // /auth/me is the session-restoration request on web and in the APK. It
      // must be allowed to refresh once when the 15-minute access cookie has
      // expired but the 7-day refresh cookie is still valid. Login/logout and
      // refresh themselves must never recurse.
      const canRefresh = allowRefresh && (!path.startsWith('/auth/') || path === '/auth/me');
      if (response.status === 401 && canRefresh) {
        await refreshSession({ silent: path === '/auth/me' });
        return perform(path, options, { allowRefresh: false });
      }
      if (retryable && attempt < MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
        await delay(300 * (2 ** attempt));
        continue;
      }
      return await parseResponse(response, options.responseType);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SESSION_EXPIRED') throw error;
      if (retryable && attempt < MAX_RETRIES && isNetworkError(error)) {
        await delay(300 * (2 ** attempt));
        continue;
      }
      throw error;
    }
  }
}

export async function apiRequest(path, options = {}) {
  const key = requestKey(path, options);
  const canDedupe = (options.method || 'GET').toUpperCase() === 'GET' && !options.signal && !options.skipDedupe;
  if (canDedupe && inFlight.has(key)) return inFlight.get(key);
  const promise = perform(path, options).finally(() => {
    if (canDedupe && inFlight.get(key) === promise) inFlight.delete(key);
  });
  if (canDedupe) inFlight.set(key, promise);
  return promise;
}

export function apiRequestBlob(path, options = {}) {
  return apiRequest(path, { ...options, responseType: 'blob' });
}

export function assetUrl(value) {
  if (!value || !value.startsWith('/uploads/')) return value;
  const origin = API_BASE.replace(/\/api$/, '');
  return `${origin}${value}`;
}
