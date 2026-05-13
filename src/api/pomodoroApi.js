import { api } from './client';

export const pomodoroApi = {
  getByDate: (date) => api.get(`/pomodoro?date=${date}`),
  create: (date, duration) => api.post('/pomodoro', { date, duration }),
};
