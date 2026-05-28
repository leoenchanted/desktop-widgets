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
      .sort((a, b) => {
        // Pinned items always come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Among pinned or non-pinned: sort by sort_order, then created_at
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

  togglePin: async (id) => {
    const existing = await getRecord('todos', id);
    if (!existing) throw new Error('Todo not found');
    if (existing.pinned) {
      if (existing.pinGroupId) {
        const allTodos = await getAllRecords('todos');
        const sameGroup = allTodos.filter(
          (t) => t.pinGroupId === existing.pinGroupId && t.id !== id,
        );
        for (const todo of sameGroup) {
          if (todo.date > existing.date) {
            // 未来日期：直接删除
            await deleteRecord('todos', todo.id);
          } else {
            // 过去日期：保留记录，只取消置顶
            await putRecord('todos', normalizeTodo({
              ...todo,
              pinned: false,
              pinGroupId: null,
              updated_at: now(),
            }));
          }
        }
      }
      return todoApi.update(id, { pinned: false, pinGroupId: null });
    }
    // Pin: move to top of list
    const siblings = await todoApi.getByDate(existing.date);
    const ts = now();
    for (const sib of siblings) {
      if (sib.id !== id) {
        await putRecord('todos', { ...sib, sort_order: (sib.sort_order ?? 0) + 1, updated_at: ts });
      }
    }
    return todoApi.update(id, { pinned: true, pinGroupId: uuidv4(), sort_order: 0 });
  },

  clonePinnedForDate: async (date) => {
    const allTodos = await getAllRecords('todos');
    const pinnedTodos = allTodos.filter((t) => t.pinned && t.pinGroupId);
    if (pinnedTodos.length === 0) return [];

    // Group by pinGroupId, keep the latest version of each
    const grouped = {};
    for (const todo of pinnedTodos) {
      const gid = todo.pinGroupId;
      if (!grouped[gid] || (todo.updated_at || '') > (grouped[gid].updated_at || '')) {
        grouped[gid] = todo;
      }
    }

    // Check which pinGroupIds already exist on this date
    const existingTodos = await todoApi.getByDate(date);
    const existingPinGroupIds = new Set(
      existingTodos.filter((t) => t.pinGroupId).map((t) => t.pinGroupId),
    );

    const clones = [];
    const timestamp = now();

    // Determine which groups need cloning, bump existing items down
    const toClone = Object.entries(grouped).filter(
      ([gid, source]) => !existingPinGroupIds.has(gid) && source.date < date,
    );

    if (toClone.length > 0) {
      for (const todo of existingTodos) {
        await putRecord('todos', { ...todo, sort_order: (todo.sort_order ?? 0) + toClone.length, updated_at: timestamp });
      }

      for (const [cloneIdx, [gid, source]] of toClone.entries()) {
        const newTodo = normalizeTodo({
          id: uuidv4(),
          date,
          text: source.text,
          completed: 0,
          pinned: true,
          pinGroupId: gid,
          sort_order: cloneIdx,
          created_at: timestamp,
          updated_at: timestamp,
        });
        await putRecord('todos', newTodo);
        clones.push(newTodo);
      }
    }

    return clones;
  },
};
