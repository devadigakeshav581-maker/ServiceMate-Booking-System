// Use relative URL in production (when served by backend), fallback to localhost for dev
export const BASE_URL = 
  window.location.hostname === 'localhost' && window.location.port !== '8080'
    ? 'http://localhost:8080' 
    : '';

// ─────────────────────────────────────────
//  TOKEN HELPERS
// ─────────────────────────────────────────

export const getToken = () => localStorage.getItem('token');
export const getRole = () => localStorage.getItem('role');
export const getUserId = () => localStorage.getItem('userId');
export const isLoggedIn = () => !!getToken();

export const saveSession = (token, role, userId) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('userId', userId ?? '');
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};

// ─────────────────────────────────────────
//  BASE FETCH WRAPPER
// ─────────────────────────────────────────

export async function apiFetch(endpoint, method = 'GET', body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (!token) { throw new Error("No token found"); }
    headers['Authorization'] = 'Bearer ' + token;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(BASE_URL + endpoint, options);

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Request failed');
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return await res.text();

  } catch (err) {
    console.error('[ServiceMate API Error]', err.message);
    throw err;
  }
}