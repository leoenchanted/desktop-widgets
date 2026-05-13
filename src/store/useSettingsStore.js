import { create } from 'zustand';

const getStored = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

export const useSettingsStore = create((set, get) => ({
  bg: localStorage.getItem('glass_bg') ||
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80',
  username: localStorage.getItem('glass_user') || 'Guest',
  activeSection: 'widgets', // 'widgets' | 'work'
  isEditMode: false,

  setBg: (bg) => {
    localStorage.setItem('glass_bg', bg);
    set({ bg });
  },
  setUsername: (username) => {
    localStorage.setItem('glass_user', username);
    set({ username });
  },
  toggleSection: () => set((s) => ({
    activeSection: s.activeSection === 'widgets' ? 'work' : 'widgets',
  })),
  setSection: (section) => set({ activeSection: section }),
  toggleEditMode: () => set((s) => ({ isEditMode: !s.isEditMode })),
}));
