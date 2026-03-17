import { apiFetch } from './core';

export const UserAPI = {
  async getProfile(id) {
    return apiFetch(`/api/users/${id}`);
  },
  async updateProfile(id, data) {
    return apiFetch(`/api/users/${id}`, 'PUT', data);
  }
};