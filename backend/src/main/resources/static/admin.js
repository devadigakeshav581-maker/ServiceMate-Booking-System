import { apiFetch } from './core';

export const AdminAPI = {
  async getUsers() {
    return apiFetch('/api/admin/users');
  },
  async setUserStatus(userId, isActive) {
    return apiFetch(`/api/admin/users/${userId}/status?active=${isActive}`, 'PUT');
  },
  async sendWarning(userId, message) {
    return apiFetch(`/api/admin/users/${userId}/warning`, 'POST', { message });
  },
  async getStats() {
    return apiFetch('/api/reports/overview');
  }
};