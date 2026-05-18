import { create } from 'zustand';

const DEFAULT_BG =
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=2940&q=80';

export const useSettingsStore = create((set) => ({
  bg: localStorage.getItem('glass_bg') || DEFAULT_BG,
  username: localStorage.getItem('glass_user') || 'Guest',
  activeSection: localStorage.getItem('glass_section') || 'widgets',
  isEditMode: false,

  setBg: (bg) => {
    localStorage.setItem('glass_bg', bg);
    set({ bg });
  },
  setUsername: (username) => {
    localStorage.setItem('glass_user', username);
    set({ username });
  },
  toggleSection: () => set((state) => {
    const activeSection = state.activeSection === 'widgets' ? 'work' : 'widgets';
    localStorage.setItem('glass_section', activeSection);
    return { activeSection };
  }),
  setSection: (activeSection) => {
    localStorage.setItem('glass_section', activeSection);
    set({ activeSection });
  },
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
}));
