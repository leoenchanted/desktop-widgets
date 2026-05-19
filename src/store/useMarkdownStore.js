import { create } from 'zustand';
import { markdownApi } from '../api/markdownApi';

export const WORKSPACE_DRAFT_KEY = 'workspace';

export const useMarkdownStore = create((set, get) => ({
  content: '',
  currentDate: WORKSPACE_DRAFT_KEY,
  wordCount: 0,
  charCount: 0,
  loading: false,

  setCurrentDate: async () => {
    await get().fetchContent(WORKSPACE_DRAFT_KEY);
  },

  fetchContent: async (date = WORKSPACE_DRAFT_KEY) => {
    set({ currentDate: WORKSPACE_DRAFT_KEY, loading: true });
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
    const { content } = get();
    const entry = await markdownApi.save(WORKSPACE_DRAFT_KEY, content);
    set({
      wordCount: entry.word_count,
      charCount: entry.char_count,
    });
    return entry;
  },
}));
