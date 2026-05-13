import { create } from 'zustand';
import { todoApi } from '../api/todoApi';

export const useTodoStore = create((set, get) => ({
  items: [],
  currentDate: new Date().toISOString().slice(0, 10),
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
      const items = await todoApi.getByDate(date);
      set({ items, loading: false });
    } catch (err) {
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
    } catch {}
  },
}));
