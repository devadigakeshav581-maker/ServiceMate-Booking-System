import { apiFetch } from './core';

export const BookingAPI = {
  async getAll() { return apiFetch('/api/bookings'); },
  async getByCustomer(id, page = 0, size = 5, status = 'ALL', address = '') {
    return apiFetch(`/api/bookings/customer/${id}?page=${page}&size=${size}&status=${status}&address=${encodeURIComponent(address)}`);
  },
  async getStatsByCustomer(id) {
    return apiFetch(`/api/bookings/customer/${id}/stats`);
  },
  async getByService(id) { return apiFetch(`/api/bookings/service/${id}`); },
  async create(data) { return apiFetch('/api/bookings/create', 'POST', data); },
  async confirm(id) { return apiFetch(`/api/bookings/confirm/${id}`, 'PUT'); },
  async complete(id) { return apiFetch(`/api/bookings/complete/${id}`, 'PUT'); },
  async cancel(id) { return apiFetch(`/api/bookings/cancel/${id}`, 'PUT'); }
};