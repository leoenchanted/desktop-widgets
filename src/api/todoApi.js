import { v4 as uuidv4 } from 'uuid';
import {
  deleteRecord,
  getAllRecords,
  getByIndex,
  getRecord,
  putRecord,
} from '../data/localDb';

const now = () => new Date().toISOString();
const DAILY_REPEAT = 'daily';

function normalizeTodo(todo) {
  if (!todo) return null;
  const isLegacyRepeating = Boolean(todo.pinned && todo.pinGroupId);
  return {
    ...todo,
    completed: todo.completed ? 1 : 0,
    deleted: todo.deleted ? 1 : 0,
    pinned: Boolean(todo.pinned),
    repeat: todo.repeat || (isLegacyRepeating ? DAILY_REPEAT : null),
    repeatStoppedAt: todo.repeatStoppedAt || null,
    sort_order: todo.sort_order ?? 0,
  };
}

function isRepeatingTodo(todo) {
  return Boolean(todo?.pinGroupId && (todo.repeat === DAILY_REPEAT || todo.pinned));
}

function isRepeatSourceForDate(todo, date) {
  if (!isRepeatingTodo(todo) || todo.deleted) return false;
  if (todo.repeatStoppedAt && date >= todo.repeatStoppedAt) return false;
  return todo.date < date;
}

async function shiftTodosDown(date, amount = 1) {
  const siblings = await todoApi.getByDate(date);
  const timestamp = now();
  for (const sibling of siblings) {
    await putRecord('todos', {
      ...sibling,
      sort_order: (sibling.sort_order ?? 0) + amount,
      updated_at: timestamp,
    });
  }
}

export const todoApi = {
  isRepeatingTodo,

  getByDate: async (date) => {
    const todos = await getByIndex('todos', 'date', date);
    return todos
      .map(normalizeTodo)
      .filter((todo) => todo && !todo.deleted)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0)
          || (a.created_at || '').localeCompare(b.created_at || '');
      });
  },

  create: async (date, text) => {
    const todos = await todoApi.getByDate(date);
    const timestamp = now();
    const todo = {
      id: uuidv4(),
      date,
      text,
      completed: 0,
      deleted: 0,
      pinned: false,
      repeat: null,
      repeatStoppedAt: null,
      pinGroupId: null,
      sort_order: todos.length,
      created_at: timestamp,
      updated_at: timestamp,
    };
    await putRecord('todos', todo);
    return todo;
  },

  createDailyRepeat: async (date, text) => {
    await shiftTodosDown(date, 1);
    const timestamp = now();
    const todo = normalizeTodo({
      id: uuidv4(),
      date,
      text,
      completed: 0,
      deleted: 0,
      pinned: true,
      repeat: DAILY_REPEAT,
      repeatStoppedAt: null,
      pinGroupId: uuidv4(),
      sort_order: 0,
      created_at: timestamp,
      updated_at: timestamp,
    });
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

  deleteOccurrence: async (id) => {
    const existing = normalizeTodo(await getRecord('todos', id));
    if (!existing) throw new Error('Todo not found');

    if (!isRepeatingTodo(existing)) {
      await deleteRecord('todos', id);
      return { ok: true };
    }

    await putRecord('todos', normalizeTodo({
      ...existing,
      completed: 0,
      deleted: 1,
      updated_at: now(),
    }));
    return { ok: true };
  },

  deleteFromDateForward: async (id) => {
    const existing = normalizeTodo(await getRecord('todos', id));
    if (!existing) throw new Error('Todo not found');

    if (!isRepeatingTodo(existing)) {
      await deleteRecord('todos', id);
      return { ok: true };
    }

    const allTodos = (await getAllRecords('todos')).map(normalizeTodo).filter(Boolean);
    const sameGroup = allTodos.filter((todo) => todo.pinGroupId === existing.pinGroupId);
    const timestamp = now();

    for (const todo of sameGroup) {
      if (todo.date >= existing.date) {
        await deleteRecord('todos', todo.id);
      } else {
        await putRecord('todos', normalizeTodo({
          ...todo,
          repeatStoppedAt: existing.date,
          updated_at: timestamp,
        }));
      }
    }

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
    return [...new Set(todos.filter((todo) => !todo.deleted).map((todo) => todo.date))]
      .sort((a, b) => b.localeCompare(a));
  },

  togglePin: async (id) => {
    const existing = normalizeTodo(await getRecord('todos', id));
    if (!existing) throw new Error('Todo not found');

    if (isRepeatingTodo(existing)) {
      const allTodos = (await getAllRecords('todos')).map(normalizeTodo).filter(Boolean);
      const sameGroup = allTodos.filter(
        (todo) => todo.pinGroupId === existing.pinGroupId && todo.id !== id,
      );
      const timestamp = now();

      for (const todo of sameGroup) {
        if (todo.date > existing.date) {
          await deleteRecord('todos', todo.id);
        } else {
          await putRecord('todos', normalizeTodo({
            ...todo,
            repeatStoppedAt: existing.date,
            updated_at: timestamp,
          }));
        }
      }

      return todoApi.update(id, {
        pinned: false,
        repeat: null,
        repeatStoppedAt: null,
        pinGroupId: null,
      });
    }

    await shiftTodosDown(existing.date, 1);
    return todoApi.update(id, {
      pinned: true,
      repeat: DAILY_REPEAT,
      repeatStoppedAt: null,
      pinGroupId: existing.pinGroupId || uuidv4(),
      sort_order: 0,
    });
  },

  clonePinnedForDate: async (date) => {
    const allTodos = (await getAllRecords('todos')).map(normalizeTodo).filter(Boolean);
    const repeatSources = allTodos.filter((todo) => isRepeatSourceForDate(todo, date));
    if (repeatSources.length === 0) return [];

    const grouped = {};
    for (const todo of repeatSources) {
      const groupId = todo.pinGroupId;
      if (!grouped[groupId] || (todo.updated_at || '') > (grouped[groupId].updated_at || '')) {
        grouped[groupId] = todo;
      }
    }

    const existingTodos = await todoApi.getByDate(date);
    const existingPinGroupIds = new Set(
      allTodos
        .filter((todo) => todo.date === date && todo.pinGroupId)
        .map((todo) => todo.pinGroupId),
    );
    const toClone = Object.entries(grouped).filter(([groupId]) => !existingPinGroupIds.has(groupId));
    if (toClone.length === 0) return [];

    const clones = [];
    const timestamp = now();

    for (const todo of existingTodos) {
      await putRecord('todos', {
        ...todo,
        sort_order: (todo.sort_order ?? 0) + toClone.length,
        updated_at: timestamp,
      });
    }

    for (const [cloneIndex, [groupId, source]] of toClone.entries()) {
      const newTodo = normalizeTodo({
        id: uuidv4(),
        date,
        text: source.text,
        completed: 0,
        deleted: 0,
        pinned: true,
        repeat: DAILY_REPEAT,
        repeatStoppedAt: source.repeatStoppedAt || null,
        pinGroupId: groupId,
        sort_order: cloneIndex,
        created_at: timestamp,
        updated_at: timestamp,
      });
      await putRecord('todos', newTodo);
      clones.push(newTodo);
    }

    return clones;
  },
};