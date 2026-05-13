import { create } from 'zustand';
import { markdownApi } from '../api/markdownApi';

export const useMarkdownStore = create((set, get) => ({
  content: '',
  currentDate: new Date().toISOString().slice(0, 10),
  wordCount: 0,
  charCount: 0,
  loading: false,

  setCurrentDate: async (date) => {
    set({ currentDate: date, loading: true });
    try {
      const entry = await markdownApi.getByDate(date);
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

  fetchContent: async (date) => {
    set({ loading: true });
    try {
      const entry = await markdownApi.getByDate(date);
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
    return entry;
  },
}));
