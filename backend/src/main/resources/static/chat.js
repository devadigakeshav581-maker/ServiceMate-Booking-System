import { apiFetch } from './core';

export const ChatAPI = {
  async getMessages(bookingId) {
    return apiFetch(`/api/chat/${bookingId}`);
  },
  async sendMessage(bookingId, data) {
    return apiFetch(`/api/chat/${bookingId}`, 'POST', data);
  }
};