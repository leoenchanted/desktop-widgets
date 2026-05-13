import { api } from './client';

export const markdownApi = {
  getByDate: (date) => api.get(`/markdown?date=${date}`),
  save: (date, content) => api.put('/markdown', { date, content }),
};
