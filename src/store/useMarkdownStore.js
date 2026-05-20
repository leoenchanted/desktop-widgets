import { create } from 'zustand';
import { markdownApi } from '../api/markdownApi';
import { today } from '../utils/date';

export const useMarkdownStore = create((set, get) => ({
  content: '',
  currentDate: today(),
  wordCount: 0,
  charCount: 0,
  loading: false,
  datesWithData: [],

  setCurrentDate: async (date = today()) => {
    await get().fetchContent(date);
  },

  fetchContent: async (date = today()) => {
    const key = date || today();
    set({ currentDate: key, loading: true });
    try {
      const entry = await markdownApi.getByDate(key);
      set({
        content: entry.content || '',
        wordCount: entry.word_count || 0,
        charCount: entry.char_count || 0,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  setContent: (content) => {
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;
    set({ content, wordCount, charCount });
  },

  saveContent: async () => {
    const { content, currentDate } = get();
    const entry = await markdownApi.save(currentDate, content);
    set({
      wordCount: entry.word_count,
      charCount: entry.char_count,
    });
    get().fetchDates();
    return entry;
  },

  fetchDates: async () => {
    try {
      const dates = await markdownApi.getAllDates();
      set({ datesWithData: dates });
    } catch (error) {
      console.error('Failed to fetch markdown dates', error);
    }
  },
}));
