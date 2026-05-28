import { create } from 'zustand';
import { todoApi } from '../api/todoApi';
import { today } from '../utils/date';

export const useTodoStore = create((set, get) => ({
  items: [],
  currentDate: today(),
  loading: false,
  datesWithData: [],

  setCurrentDate: async (date) => {
    set({ currentDate: date, loading: true });
    try {
      const items = await todoApi.getByDate(date);
      set({ items, loading: false });
    } catch (err) {
      set({ loading: false });
    }
  },

  fetchTodos: async (date) => {
    set({ loading: true });
    try {
      // Clone pinned todos from previous dates for this date
      await todoApi.clonePinnedForDate(date);
      const items = await todoApi.getByDate(date);
      set({ items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addTodo: async (text) => {
    const { currentDate } = get();
    const todo = await todoApi.create(currentDate, text);
    set((s) => ({ items: [...s.items, todo] }));
    return todo;
  },

  toggleTodo: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    await todoApi.update(id, { completed: item.completed ? 0 : 1 });
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id ? { ...i, completed: i.completed ? 0 : 1 } : i
      ),
    }));
  },

  updateTodo: async (id, text) => {
    await todoApi.update(id, { text });
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, text } : i)),
    }));
  },

  deleteTodo: async (id) => {
    await todoApi.delete(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  togglePin: async (id) => {
    await todoApi.togglePin(id);
    // Refetch sorted list so sort_order changes take effect
    const { currentDate } = get();
    const items = await todoApi.getByDate(currentDate);
    set({ items });
  },

  reorderTodos: async (orderedIds) => {
    const { currentDate } = get();
    await todoApi.reorder(currentDate, orderedIds);
    set((s) => {
      const map = {};
      orderedIds.forEach((id, idx) => { map[id] = idx; });
      return {
        items: [...s.items].sort((a, b) => map[a.id] - map[b.id]),
      };
    });
  },

  fetchDates: async () => {
    try {
      const dates = await todoApi.getAllDates();
      set({ datesWithData: dates });
    } catch (error) {
      console.error('Failed to fetch todo dates', error);
    }
  },
}));
