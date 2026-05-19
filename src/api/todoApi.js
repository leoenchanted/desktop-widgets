import { v4 as uuidv4 } from 'uuid';
import {
  deleteRecord,
  getAllRecords,
  getByIndex,
  getRecord,
  putRecord,
} from '../data/localDb';

const now = () => new Date().toISOString();

function normalizeTodo(todo) {
  return {
    ...todo,
    completed: todo.completed ? 1 : 0,
    sort_order: todo.sort_order ?? 0,
  };
}

export const todoApi = {
  getByDate: async (date) => {
    const todos = await getByIndex('todos', 'date', date);
    return todos
      .map(normalizeTodo)
      .sort((a, b) => (
        (a.sort_order ?? 0) - (b.sort_order ?? 0)
        || (a.created_at || '').localeCompare(b.created_at || '')
      ));
  },

  create: async (date, text) => {
    const todos = await todoApi.getByDate(date);
    const timestamp = now();
    const todo = {
      id: uuidv4(),
      date,
      text,
      completed: 0,
      sort_order: todos.length,
      created_at: timestamp,
      updated_at: timestamp,
    };
    await putRecord('todos', todo);
    return todo;
  },

  update: async (id, fields) => {
    const existing = await getRecord('todos', id);
    if (!existing) throw new Error('Todo not found');
    const next = normalizeTodo({
      ...existing,
      ...fields,
      completed: fields.completed !== undefined ? Number(fields.completed) : existing.completed,
      updated_at: now(),
    });
    await putRecord('todos', next);
    return next;
  },

  delete: async (id) => {
    await deleteRecord('todos', id);
    return { ok: true };
  },

  reorder: async (date, orderedIds) => {
    const todos = await todoApi.getByDate(date);
    const byId = new Map(todos.map((todo) => [todo.id, todo]));
    const timestamp = now();
    for (const [sortOrder, id] of orderedIds.entries()) {
      const todo = byId.get(id);
      if (todo) {
        await putRecord('todos', { ...todo, sort_order: sortOrder, updated_at: timestamp });
      }
    }
    return { ok: true };
  },

  getAllDates: async () => {
    const todos = await getAllRecords('todos');
    return [...new Set(todos.map((todo) => todo.date))].sort((a, b) => b.localeCompare(a));
  },
};
