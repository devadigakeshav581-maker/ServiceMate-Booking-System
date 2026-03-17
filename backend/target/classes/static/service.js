import { apiFetch } from './core';

export const ServiceAPI = {
  async getAll() { return apiFetch('/api/services'); },
  async getById(id) { return apiFetch(`/api/services/${id}`); },
  async getByProvider(id) { return apiFetch(`/api/services/provider/${id}`); },
  async create(data) { return apiFetch('/api/services', 'POST', data); },
  async update(id, data) { return apiFetch(`/api/services/${id}`, 'PUT', data); },
  async delete(id) { return apiFetch(`/api/services/${id}`, 'DELETE'); }
};