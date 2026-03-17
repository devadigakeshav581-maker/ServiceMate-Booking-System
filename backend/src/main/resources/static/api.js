export const BASE_URL = 'http://localhost:8080';

// --- Token & Auth Helpers ---

/**
 * Decodes the payload of a JWT token.
 * NOTE: This does NOT verify the signature. It's for client-side convenience only.
 * @param {string} token The JWT token.
 * @returns {object|null} The decoded payload.
 */
const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    console.error('Failed to decode JWT', e);
    return null;
  }
};

export const getToken = () => localStorage.getItem('token');

export const getDecodedToken = () => {
  const token = getToken();
  return token ? decodeJwt(token) : null;
};

export const getUserId = () => {
  // Components rely on this being in localStorage directly after login.
  return localStorage.getItem('userId');
};

export const getRole = () => localStorage.getItem('role');

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('userId');
  // Force a reload to clear all state and redirect via PrivateRoute logic
  window.location.href = '/login';
};

// --- Generic API Fetch Wrapper ---

const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // For FormData, let the browser set the Content-Type with the correct boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'An API error occurred');
  }

  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return null; // No content
  }

  return response.json();
};

// --- API Modules ---

export const AuthAPI = {
  login: async (credentials) => {
    // Use a direct fetch call to handle a plain text token response
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'Login failed');
    }

    const token = await response.text();
    if (token) {
      localStorage.setItem('token', token);
      const decoded = decodeJwt(token);
      if (decoded) {
        // Store role and userId for easy access by components and other API calls
        localStorage.setItem('role', decoded.role);
        localStorage.setItem('userId', decoded.userId || decoded.sub);
      }
    }
    return token;
  },
  register: (userData) => apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

export const ServiceAPI = {
  getAll: () => apiFetch('/services'),
  getByProvider: (providerId) => apiFetch(`/services/provider/${providerId}`),
  create: (serviceData) => apiFetch('/services', { method: 'POST', body: JSON.stringify(serviceData) }),
  update: (id, serviceData) => apiFetch(`/services/${id}`, { method: 'PUT', body: JSON.stringify(serviceData) }),
  delete: (id) => apiFetch(`/services/${id}`, { method: 'DELETE' }),
};

export const BookingAPI = {
  getAll: () => apiFetch('/bookings'),
  getByCustomer: (customerId, page = 0, size = 5, status = 'ALL', search = '') => {
    const params = new URLSearchParams({ page, size, status, search });
    return apiFetch(`/bookings/customer/${customerId}?${params.toString()}`);
  },
  getByService: (serviceId) => apiFetch(`/bookings/service/${serviceId}`),
  getStatsByCustomer: (customerId) => apiFetch(`/bookings/stats/customer/${customerId}`),
  create: (bookingData) => apiFetch('/bookings/create', { method: 'POST', body: JSON.stringify(bookingData) }),
  confirm: (id) => apiFetch(`/bookings/confirm/${id}`, { method: 'PUT' }),
  complete: (id) => apiFetch(`/bookings/complete/${id}`, { method: 'PUT' }),
  cancel: (id) => apiFetch(`/bookings/cancel/${id}`, { method: 'PUT' }),
};

export const PaymentAPI = {
  getByCustomer: (userId, page = 0, size = 5) => apiFetch(`/payments/user/${userId}?page=${page}&size=${size}`),
  refund: (paymentId) => apiFetch(`/payments/${paymentId}/refund`, { method: 'POST' }),
  pay: (paymentData) => apiFetch('/payments/pay', { method: 'POST', body: JSON.stringify(paymentData) }),
  getStatus: (bookingId) => apiFetch(`/payments/status/${bookingId}`),
};

export const AdminAPI = {
  getUsers: () => apiFetch('/admin/users'),
  getStats: () => apiFetch('/admin/stats'),
  setUserStatus: (userId, isActive) => apiFetch(`/admin/users/${userId}/status?active=${isActive}`, { method: 'PUT' }),
  sendWarning: (userId, message) => apiFetch(`/admin/users/${userId}/warning`, { method: 'POST', body: JSON.stringify({ message }) }),
};

export const UserAPI = {
  getProfile: (userId) => apiFetch(`/users/${userId}`),
  updateProfile: (userId, formData) => apiFetch(`/users/${userId}`, { method: 'PUT', body: formData }),
};

export const ChatAPI = {
  getMessages: (bookingId) => apiFetch(`/chats/${bookingId}/messages`),
  sendMessage: (bookingId, message) => apiFetch(`/chats/${bookingId}/messages`, { method: 'POST', body: JSON.stringify(message) }),
};