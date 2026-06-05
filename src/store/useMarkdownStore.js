import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { markdownApi } from '../api/markdownApi';
import { today } from '../utils/date';

const now = () => new Date().toISOString();

export const useMarkdownStore = create((set, get) => ({
  content: '',
  currentDate: today(),
  wordCount: 0,
  charCount: 0,
  loading: false,
  datesWithData: [],
  pages: [],
  activePageId: null,

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
        pages: entry.pages || [],
        activePageId: entry.activePageId || entry.pages?.[0]?.id || null,
        wordCount: entry.word_count || 0,
        charCount: entry.char_count || 0,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  openPageAt: async (date = today(), pageId = null) => {
    const key = date || today();
    set({ currentDate: key, loading: true });
    try {
      const entry = await markdownApi.getByDate(key);
      const targetPageId = pageId && entry.pages?.some((p) => p.id === pageId)
        ? pageId
        : entry.activePageId || entry.pages?.[0]?.id || null;
      const page = entry.pages?.find((p) => p.id === targetPageId) || entry.pages?.[0];
      const content = page?.content || '';
      set({
        content,
        pages: entry.pages || [],
        activePageId: targetPageId,
        wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
        charCount: content.length,
        loading: false,
      });
      return { ...entry, activePageId: targetPageId, content };
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  setContent: (content) => {
    const { pages, activePageId } = get();
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const charCount = content.length;
    const updatedPages = pages.map((p) =>
      p.id === activePageId ? { ...p, content, updated_at: now() } : p,
    );
    set({ content, wordCount, charCount, pages: updatedPages });
  },

  addPage: () => {
    const { pages } = get();
    const pageNum = pages.length + 1;
    const newPage = {
      id: uuidv4(),
      title: `页面 ${pageNum}`,
      content: '',
      created_at: now(),
      updated_at: now(),
    };
    set({
      pages: [...pages, newPage],
      activePageId: newPage.id,
      content: '',
      wordCount: 0,
      charCount: 0,
    });
  },

  removePage: (pageId) => {
    const { pages, activePageId } = get();
    if (pages.length <= 1) return;
    const filtered = pages.filter((p) => p.id !== pageId);
    const isRemovingActive = pageId === activePageId;
    let nextActiveId = activePageId;
    if (isRemovingActive) {
      const removedIndex = pages.findIndex((p) => p.id === pageId);
      const nextPage = filtered[Math.min(removedIndex, filtered.length - 1)];
      nextActiveId = nextPage.id;
    }
    const nextPage = filtered.find((p) => p.id === nextActiveId) || filtered[0];
    set({
      pages: filtered,
      activePageId: nextActiveId,
      content: nextPage?.content || '',
      wordCount: nextPage?.content?.trim() ? nextPage.content.trim().split(/\s+/).length : 0,
      charCount: nextPage?.content?.length || 0,
    });
  },

  switchPage: (pageId) => {
    const { pages } = get();
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    set({
      activePageId: pageId,
      content: page.content || '',
      wordCount: page.content?.trim() ? page.content.trim().split(/\s+/).length : 0,
      charCount: page.content?.length || 0,
    });
  },

  renamePage: (pageId, title) => {
    const { pages } = get();
    set({
      pages: pages.map((p) => (p.id === pageId ? { ...p, title } : p)),
    });
  },

  saveContent: async () => {
    const { pages, activePageId, currentDate } = get();
    const entry = await markdownApi.save(currentDate, { pages, activePageId });
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
