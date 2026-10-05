const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const SESSION_KEY = 'rural-company-session';

// The JWT stays in the HttpOnly server cookie. This non-sensitive marker only lets the UI
// know whether it should try restoring a session after reload.
export const hasSession = () => { try { return window.localStorage.getItem(SESSION_KEY) === '1'; } catch { return false; } };
export const saveToken = () => { try { window.localStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ } };
export const clearToken = () => { try { window.localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ } };

export const AUTH_EXPIRED_EVENT = 'rural-company-auth-expired';

export async function apiRequest(path, { method = 'GET', body, token = null, headers = {}, notifyExpired = true } = {}) {
  const requestHeaders = { ...headers };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) requestHeaders['Content-Type'] = 'application/json';
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // A rejected token on a logged-in request means the session expired
    if (response.status === 401 && (token || (hasSession() && path !== '/api/user/login'))) {
      clearToken();
      if (notifyExpired) window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
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

export const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
export const unitLabel = (unit) => (unit === 'total' ? 'total payment' : `per ${unit || 'month'}`);

// ---- distance search (PIN code based; the backend does the maths) ----
export const RADIUS_OPTIONS = ['10', '20', '30', '50', '100'];
export const formatDistance = (km) => (km === undefined || km === null ? '' : km < 1 ? 'under 1 km' : `${Math.round(km)} km`);
// radius === 'any' (or no PIN) means "do not filter by distance"
export const buildSearchParams = ({ q = '', place = '', pin = '', radius = '30', limit, filters = {} } = {}) => {
  const params = new URLSearchParams();
  if (q.trim()) params.set('q', q.trim());
  if (place.trim()) params.set('place', place.trim());
  if (pin.trim() && radius !== 'any') { params.set('pinCode', pin.trim()); params.set('radiusKm', radius); }
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, String(value));
  });
  if (limit) params.set('limit', String(limit));
  return params;
};
