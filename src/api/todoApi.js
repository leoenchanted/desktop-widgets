import { api } from './client';

export const todoApi = {
  getByDate: (date) => api.get(`/todos?date=${date}`),
  create: (date, text) => api.post('/todos', { date, text }),
  update: (id, fields) => api.patch(`/todos/${id}`, fields),
  delete: (id) => api.del(`/todos/${id}`),
  reorder: (date, orderedIds) => api.put('/todos/reorder', { date, orderedIds }),
  getAllDates: () => api.get('/todos/dates'),
};
