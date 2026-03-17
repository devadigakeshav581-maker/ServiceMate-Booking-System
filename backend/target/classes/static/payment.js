import { apiFetch } from './core';

export const PaymentAPI = {
  async getByCustomer(userId, page = 0, size = 5) {
    return apiFetch(`/api/payments/customer/${userId}?page=${page}&size=${size}`);
  },
  async refund(id) { return apiFetch(`/api/payments/refund/${id}`, 'POST'); },
  async downloadReceipt(id) { return apiFetch(`/api/payments/receipt/${id}`); },
  async pay(data) { return apiFetch('/api/payments/pay', 'POST', data); },
  async getStatus(id) { return apiFetch(`/api/payments/status/${id}`); }
};