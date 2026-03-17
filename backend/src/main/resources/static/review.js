import { apiFetch } from './core';

export const ReviewAPI = {
  async getForService(serviceId, sort = 'createdAt,desc') {
    return apiFetch(`/api/services/${serviceId}/reviews?sort=${sort}`);
  },
  async markHelpful(reviewId) {
    return apiFetch(`/api/reviews/${reviewId}/helpful`, 'POST');
  }
};