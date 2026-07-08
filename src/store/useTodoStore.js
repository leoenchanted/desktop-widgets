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
    } catch {
      set({ loading: false });
    }
  },

  fetchTodos: async (date) => {
    set({ loading: true });
    try {
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
    set((state) => ({ items: [...state.items, todo] }));
    return todo;
  },

  addRepeatingTodo: async (text) => {
    const { currentDate } = get();
    const todo = await todoApi.createDailyRepeat(currentDate, text);
    const items = await todoApi.getByDate(currentDate);
    const datesWithData = await todoApi.getAllDates();
    set({ items, datesWithData });
    return todo;
  },

  toggleTodo: async (id) => {
    const item = get().items.find((todo) => todo.id === id);
    if (!item) return;
    await todoApi.update(id, { completed: item.completed ? 0 : 1 });
    set((state) => ({
      items: state.items.map((todo) => (
        todo.id === id ? { ...todo, completed: todo.completed ? 0 : 1 } : todo
      )),
    }));
  },

  updateTodo: async (id, text) => {
    await todoApi.update(id, { text });
    set((state) => ({
      items: state.items.map((todo) => (todo.id === id ? { ...todo, text } : todo)),
    }));
  },

  deleteTodo: async (id, scope = 'single') => {
    if (scope === 'future') {
      await todoApi.deleteFromDateForward(id);
    } else {
      await todoApi.deleteOccurrence(id);
    }

    const { currentDate } = get();
    const items = await todoApi.getByDate(currentDate);
    const datesWithData = await todoApi.getAllDates();
    set({ items, datesWithData });
  },

  togglePin: async (id) => {
    await todoApi.togglePin(id);
    const { currentDate } = get();
    const items = await todoApi.getByDate(currentDate);
    const datesWithData = await todoApi.getAllDates();
    set({ items, datesWithData });
  },

  reorderTodos: async (orderedIds) => {
    const { currentDate } = get();
    await todoApi.reorder(currentDate, orderedIds);
    set((state) => {
      const orderMap = {};
      orderedIds.forEach((id, index) => { orderMap[id] = index; });
      return {
        items: [...state.items].sort((a, b) => orderMap[a.id] - orderMap[b.id]),
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