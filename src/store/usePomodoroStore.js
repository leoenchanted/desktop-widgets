import { create } from 'zustand';
import { pomodoroApi } from '../api/pomodoroApi';
import { getSetting, setSetting } from '../data/localDb';
import { today } from '../utils/date';

const DEFAULT_DURATION = 25;
const MIN_DURATION = 5;
const MAX_DURATION = 120;

const clampDuration = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_DURATION;
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(numeric)));
};

export const usePomodoroStore = create((set, get) => ({
  durationMinutes: DEFAULT_DURATION,
  minutes: DEFAULT_DURATION,
  seconds: 0,
  isRunning: false,
  sessionCount: 0,
  focusMinutes: 0,
  currentDate: today(),
  intervalId: null,

  initializeDuration: async () => {
    const duration = clampDuration(await getSetting('pomodoroDuration', DEFAULT_DURATION));
    set((state) => ({
      durationMinutes: duration,
      minutes: state.isRunning ? state.minutes : duration,
      seconds: state.isRunning ? state.seconds : 0,
    }));
  },

  setDuration: async (value) => {
    const duration = clampDuration(value);
    await setSetting('pomodoroDuration', duration);
    set((state) => ({
      durationMinutes: duration,
      minutes: state.isRunning ? state.minutes : duration,
      seconds: state.isRunning ? state.seconds : 0,
    }));
  },

  setCurrentDate: async (date) => {
    const { currentDate, durationMinutes, isRunning } = get();
    if (currentDate !== date) {
      set({
        currentDate: date,
        sessionCount: 0,
        focusMinutes: 0,
        ...(isRunning ? {} : { minutes: durationMinutes, seconds: 0 }),
      });
    }
    await get().fetchSessions(date);
  },

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
    const { intervalId, durationMinutes } = get();
    if (intervalId) clearInterval(intervalId);
    set({ minutes: durationMinutes, seconds: 0, isRunning: false, intervalId: null });
  },

  completeSession: async () => {
    const { intervalId, currentDate, durationMinutes } = get();
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null });
    try {
      await pomodoroApi.create(currentDate, durationMinutes);
      set((state) => ({
        minutes: durationMinutes,
        seconds: 0,
        isRunning: false,
        sessionCount: state.sessionCount + 1,
        focusMinutes: state.focusMinutes + durationMinutes,
      }));
    } catch {
      set({ minutes: durationMinutes, seconds: 0, isRunning: false });
    }
  },

  fetchSessions: async (date) => {
    try {
      const sessions = await pomodoroApi.getByDate(date);
      set({
        sessionCount: sessions.length,
        focusMinutes: sessions.reduce((total, session) => total + Number(session.duration || 0), 0),
      });
    } catch (error) {
      console.error('Failed to fetch pomodoro sessions', error);
    }
  },

  cleanup: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
  },
}));
