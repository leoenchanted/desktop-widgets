import { v4 as uuidv4 } from 'uuid';
import { getByIndex, getRecord, putRecord } from '../data/localDb';

const WORKSPACE_KEY = 'workspace';
const now = () => new Date().toISOString();

async function buildReview(date) {
  const [todos, markdown, sessions] = await Promise.all([
    getByIndex('todos', 'date', date),
    getRecord('markdown_entries', WORKSPACE_KEY),
    getByIndex('pomodoro_sessions', 'date', date),
  ]);

  return {
    todo_completed: todos.filter((todo) => Boolean(todo.completed)).length,
    todo_total: todos.length,
    markdown_word_count: markdown?.word_count || 0,
    pomodoro_count: sessions.filter((session) => Boolean(session.completed)).length,
  };
}

export const reviewApi = {
  getByDate: async (date) => getRecord('daily_reviews', date) || null,

  generate: async (date) => {
    const existing = await getRecord('daily_reviews', date);
    const timestamp = now();
    const metrics = await buildReview(date);
    const review = {
      id: existing?.id || uuidv4(),
      date,
      notes: existing?.notes || '',
      ...metrics,
      generated_at: timestamp,
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    await putRecord('daily_reviews', review);
    return review;
  },

  saveNotes: async (date, notes) => {
    const existing = await getRecord('daily_reviews', date);
    const timestamp = now();
    const metrics = existing || (await buildReview(date));
    const review = {
      id: existing?.id || uuidv4(),
      date,
      todo_completed: metrics.todo_completed || 0,
      todo_total: metrics.todo_total || 0,
      markdown_word_count: metrics.markdown_word_count || 0,
      pomodoro_count: metrics.pomodoro_count || 0,
      generated_at: existing?.generated_at || timestamp,
      notes,
      created_at: existing?.created_at || timestamp,
      updated_at: timestamp,
    };
    await putRecord('daily_reviews', review);
    return review;
  },
};
