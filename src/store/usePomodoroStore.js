import { create } from 'zustand';
import { pomodoroApi } from '../api/pomodoroApi';
import { today } from '../utils/date';

export const usePomodoroStore = create((set, get) => ({
  minutes: 25,
  seconds: 0,
  isRunning: false,
  sessionCount: 0,
  currentDate: today(),
  intervalId: null,

  start: () => {
    const { intervalId } = get();
    if (intervalId) return;
    const id = setInterval(() => {
      const { minutes, seconds, isRunning } = get();
      if (!isRunning) return;
      if (minutes === 0 && seconds === 0) {
        get().completeSession();
        return;
      }
      if (seconds === 0) {
        set({ minutes: minutes - 1, seconds: 59 });
      } else {
        set({ seconds: seconds - 1 });
      }
    }, 1000);
    set({ isRunning: true, intervalId: id });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ isRunning: false, intervalId: null });
  },

  reset: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({ minutes: 25, seconds: 0, isRunning: false, intervalId: null });
  },

  completeSession: async () => {
    const { intervalId, currentDate } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null });
    try {
      await pomodoroApi.create(currentDate, 25);
      set((s) => ({
        minutes: 25,
        seconds: 0,
        isRunning: false,
        sessionCount: s.sessionCount + 1,
      }));
    } catch {
      set({ minutes: 25, seconds: 0, isRunning: false });
    }
  },

  fetchSessions: async (date) => {
    try {
      const sessions = await pomodoroApi.getByDate(date);
      set({ sessionCount: sessions.length });
    } catch (error) {
      console.error('Failed to fetch pomodoro sessions', error);
    }
  },

  cleanup: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
  },
}));
