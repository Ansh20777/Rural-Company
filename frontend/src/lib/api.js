const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'urban-company-token';

export const getToken = () => window.localStorage.getItem(TOKEN_KEY);
export const saveToken = (token) => window.localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY);

export async function apiRequest(path, { method = 'GET', body, token = getToken(), headers = {} } = {}) {
  const requestHeaders = { ...headers };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload.error && payload.error !== payload.message ? `: ${payload.error}` : '';
    throw new Error(`${payload.message || `Request failed (${response.status})`}${detail}`);
  }
  return payload;
}

export const toQueryString = (values) => {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
};
