import { apiFetch, saveSession } from './core';

export const AuthAPI = {
  async register(data) {
    return apiFetch('/api/auth/register', 'POST', data, false);
  },

  async login(data) {
    const token = await apiFetch('/api/auth/login', 'POST', data, false);
    if (token) {
      saveSession(token, data.role || 'CUSTOMER', null);
    }
    return token;
  },

  async verify(token) {
    return apiFetch(`/api/auth/verify?token=${token}`, 'GET', null, false);
  }
};