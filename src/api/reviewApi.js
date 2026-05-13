import { api } from './client';

export const reviewApi = {
  getByDate: (date) => api.get(`/reviews?date=${date}`),
  generate: (date) => api.post('/reviews/generate', { date }),
  saveNotes: (date, notes) => api.put('/reviews', { date, notes }),
};
