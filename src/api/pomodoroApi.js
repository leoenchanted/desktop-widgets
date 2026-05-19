import { v4 as uuidv4 } from 'uuid';
import { getByIndex, putRecord } from '../data/localDb';

const now = () => new Date().toISOString();

export const pomodoroApi = {
  getByDate: async (date) => {
    const sessions = await getByIndex('pomodoro_sessions', 'date', date);
    return sessions.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  },

  create: async (date, duration) => {
    const timestamp = now();
    const session = {
      id: uuidv4(),
      date,
      duration,
      completed: 1,
      started_at: timestamp,
      ended_at: timestamp,
      created_at: timestamp,
    };
    await putRecord('pomodoro_sessions', session);
    return session;
  },
};
