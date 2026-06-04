import { create } from 'zustand';
import { pomodoroApi } from '../api/pomodoroApi';
import { getSetting, setSetting } from '../data/localDb';
import { today } from '../utils/date';

const DEFAULT_DURATION = 25;
const MIN_DURATION = 1;
const MAX_DURATION = 120;
const ACTIVE_SESSION_KEY = 'pomodoroActiveSession';

const clampDuration = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_DURATION;
  return Math.max(MIN_DURATION, Math.min(MAX_DURATION, Math.round(numeric)));
};

const durationToSeconds = (duration) => clampDuration(duration) * 60;

const splitSeconds = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.ceil(Number(totalSeconds) || 0));
  return {
    minutes: Math.floor(safeSeconds / 60),
    seconds: safeSeconds % 60,
    remainingSeconds: safeSeconds,
  };
};

const remainingFromEndsAt = (endsAt) => {
  const endTime = new Date(endsAt).getTime();
  if (!Number.isFinite(endTime)) return 0;
  return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
};

const persistActiveSession = (session) => {
  setSetting(ACTIVE_SESSION_KEY, session).catch((error) => {
    console.error('Failed to persist pomodoro session state', error);
  });
};

export const usePomodoroStore = create((set, get) => ({
  durationMinutes: DEFAULT_DURATION,
  minutes: DEFAULT_DURATION,
  seconds: 0,
  remainingSeconds: durationToSeconds(DEFAULT_DURATION),
  isRunning: false,
  isCompleting: false,
  completionGuardKey: null,
  completionSignal: 0,
  soundEnabled: true,
  notificationEnabled: false,
  sessionCount: 0,
  focusMinutes: 0,
  currentDate: today(),
  intervalId: null,
  startedAt: null,
  endsAt: null,
  sessionDate: null,

  initializeDuration: async () => {
    const [
      storedDuration,
      activeSession,
      soundEnabled,
      notificationEnabled,
    ] = await Promise.all([
      getSetting('pomodoroDuration', DEFAULT_DURATION),
      getSetting(ACTIVE_SESSION_KEY, null),
      getSetting('pomodoroSoundEnabled', true),
      getSetting('pomodoroNotificationEnabled', false),
    ]);
    const duration = clampDuration(storedDuration);
    const settingsState = {
      soundEnabled: soundEnabled !== false,
      notificationEnabled: Boolean(notificationEnabled),
    };

    if (activeSession?.status === 'running' && activeSession.endsAt) {
      const remainingSeconds = remainingFromEndsAt(activeSession.endsAt);
      const sessionDuration = clampDuration(activeSession.durationMinutes || duration);
      const sessionDate = activeSession.date || today();
      const startedAt = activeSession.startedAt || activeSession.started_at || new Date().toISOString();

      set({
        durationMinutes: sessionDuration,
        ...splitSeconds(remainingSeconds),
        isRunning: true,
        isCompleting: false,
        startedAt,
        endsAt: activeSession.endsAt,
        sessionDate,
        ...settingsState,
      });

      get().ensureTicker();
      if (remainingSeconds <= 0) get().completeSession();
      return;
    }

    if (activeSession?.status === 'paused') {
      const sessionDuration = clampDuration(activeSession.durationMinutes || duration);
      const remainingSeconds = Math.min(
        durationToSeconds(sessionDuration),
        Math.max(0, Number(activeSession.remainingSeconds) || durationToSeconds(sessionDuration)),
      );

      set({
        durationMinutes: sessionDuration,
        ...splitSeconds(remainingSeconds),
        isRunning: false,
        isCompleting: false,
        startedAt: activeSession.startedAt || activeSession.started_at || null,
        endsAt: null,
        sessionDate: activeSession.date || today(),
        ...settingsState,
      });
      return;
    }

    set({
      durationMinutes: duration,
      ...splitSeconds(durationToSeconds(duration)),
      isRunning: false,
      isCompleting: false,
      startedAt: null,
      endsAt: null,
      sessionDate: null,
      ...settingsState,
    });
  },

  setSoundEnabled: async (soundEnabled) => {
    const enabled = Boolean(soundEnabled);
    set({ soundEnabled: enabled });
    await setSetting('pomodoroSoundEnabled', enabled);
  },

  setNotificationEnabled: async (notificationEnabled) => {
    const enabled = Boolean(notificationEnabled);
    set({ notificationEnabled: enabled });
    await setSetting('pomodoroNotificationEnabled', enabled);
  },

  setDuration: async (value) => {
    const duration = clampDuration(value);
    await setSetting('pomodoroDuration', duration);
    if (!get().isRunning) persistActiveSession(null);
    set((state) => ({
      durationMinutes: duration,
      ...(state.isRunning ? {} : splitSeconds(durationToSeconds(duration))),
      ...(state.isRunning ? {} : { startedAt: null, endsAt: null, sessionDate: null }),
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
    const state = get();
    if (state.isRunning) return;

    const remainingSeconds = state.remainingSeconds > 0
      ? state.remainingSeconds
      : durationToSeconds(state.durationMinutes);
    const startedAt = state.startedAt || new Date().toISOString();
    const endsAt = new Date(Date.now() + remainingSeconds * 1000).toISOString();
    const sessionDate = state.sessionDate || state.currentDate;

    set({
      isRunning: true,
      isCompleting: false,
      completionGuardKey: null,
      startedAt,
      endsAt,
      sessionDate,
      ...splitSeconds(remainingSeconds),
    });

    persistActiveSession({
      status: 'running',
      date: sessionDate,
      durationMinutes: state.durationMinutes,
      startedAt,
      endsAt,
      updatedAt: new Date().toISOString(),
    });
    get().ensureTicker();
  },

  pause: () => {
    const { intervalId, durationMinutes, startedAt, sessionDate } = get();
    if (intervalId) clearInterval(intervalId);
    const remainingSeconds = get().getRemainingSeconds();
    set({
      isRunning: false,
      intervalId: null,
      endsAt: null,
      ...splitSeconds(remainingSeconds),
    });
    persistActiveSession({
      status: 'paused',
      date: sessionDate || get().currentDate,
      durationMinutes,
      remainingSeconds,
      startedAt,
      updatedAt: new Date().toISOString(),
    });
  },

  reset: () => {
    const { intervalId, durationMinutes } = get();
    if (intervalId) clearInterval(intervalId);
    persistActiveSession(null);
    set({
      ...splitSeconds(durationToSeconds(durationMinutes)),
      isRunning: false,
      isCompleting: false,
      completionGuardKey: null,
      intervalId: null,
      startedAt: null,
      endsAt: null,
      sessionDate: null,
    });
  },

  completeSession: async () => {
    const {
      intervalId,
      currentDate,
      durationMinutes,
      sessionDate,
      startedAt,
      endsAt,
      isCompleting,
      completionGuardKey,
    } = get();
    const recordDate = sessionDate || currentDate;
    const guardKey = `${recordDate}:${startedAt || ''}:${endsAt || ''}:${durationMinutes}`;
    if (isCompleting || completionGuardKey === guardKey) return;
    if (intervalId) clearInterval(intervalId);
    set({ intervalId: null, isCompleting: true, completionGuardKey: guardKey, ...splitSeconds(0) });
    const endedAt = endsAt && new Date(endsAt).getTime() <= Date.now()
      ? endsAt
      : new Date().toISOString();
    try {
      await pomodoroApi.create(recordDate, durationMinutes, {
        startedAt,
        endedAt,
      });
      persistActiveSession(null);
      set((state) => ({
        ...splitSeconds(durationToSeconds(durationMinutes)),
        isRunning: false,
        isCompleting: false,
        startedAt: null,
        endsAt: null,
        sessionDate: null,
        sessionCount: recordDate === state.currentDate ? state.sessionCount + 1 : state.sessionCount,
        focusMinutes: recordDate === state.currentDate ? state.focusMinutes + durationMinutes : state.focusMinutes,
        completionSignal: state.completionSignal + 1,
      }));
    } catch {
      set({
        ...splitSeconds(durationToSeconds(durationMinutes)),
        isRunning: false,
        isCompleting: false,
        completionGuardKey: null,
        startedAt: null,
        endsAt: null,
        sessionDate: null,
      });
    }
  },

  getRemainingSeconds: () => {
    const { isRunning, endsAt, remainingSeconds } = get();
    if (!isRunning || !endsAt) return remainingSeconds;
    return remainingFromEndsAt(endsAt);
  },

  syncWithClock: () => {
    const { isRunning, endsAt, isCompleting } = get();
    if (!isRunning || !endsAt || isCompleting) return;

    const remainingSeconds = remainingFromEndsAt(endsAt);
    set(splitSeconds(remainingSeconds));

    if (remainingSeconds <= 0) {
      get().completeSession();
    }
  },

  ensureTicker: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    const id = setInterval(() => {
      get().syncWithClock();
    }, 1000);
    set({ intervalId: id });
    get().syncWithClock();
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
    set({ intervalId: null });
  },
}));
