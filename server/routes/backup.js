const { Router } = require('express');
const { queryAll, execute, saveDb } = require('../db/database');

const router = Router();

router.get('/export', (req, res) => {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      todos: queryAll('SELECT * FROM todos ORDER BY date, sort_order'),
      markdown_entries: queryAll('SELECT * FROM markdown_entries ORDER BY date'),
      daily_reviews: queryAll('SELECT * FROM daily_reviews ORDER BY date'),
      pomodoro_sessions: queryAll('SELECT * FROM pomodoro_sessions ORDER BY date'),
      settings: queryAll('SELECT * FROM settings'),
    },
  };
  res.json(data);
});

router.post('/import', (req, res) => {
  const { data } = req.body;
  if (!data) return res.status(400).json({ error: 'data required' });

  // Clear existing data in a transaction-like sequence
  execute('DELETE FROM todos');
  execute('DELETE FROM markdown_entries');
  execute('DELETE FROM daily_reviews');
  execute('DELETE FROM pomodoro_sessions');
  execute('DELETE FROM settings');

  // Import each table
  for (const row of data.todos || []) {
    execute(
      'INSERT INTO todos (id, date, text, completed, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.date, row.text, row.completed, row.sort_order, row.created_at, row.updated_at]
    );
  }
  for (const row of data.markdown_entries || []) {
    execute(
      'INSERT INTO markdown_entries (id, date, content, word_count, char_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.date, row.content, row.word_count, row.char_count, row.created_at, row.updated_at]
    );
  }
  for (const row of data.daily_reviews || []) {
    execute(
      'INSERT INTO daily_reviews (id, date, notes, todo_completed, todo_total, markdown_word_count, pomodoro_count, generated_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.date, row.notes, row.todo_completed, row.todo_total, row.markdown_word_count, row.pomodoro_count, row.generated_at, row.created_at, row.updated_at]
    );
  }
  for (const row of data.pomodoro_sessions || []) {
    execute(
      'INSERT INTO pomodoro_sessions (id, date, duration, completed, started_at, ended_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [row.id, row.date, row.duration, row.completed, row.started_at, row.ended_at, row.created_at]
    );
  }
  for (const row of data.settings || []) {
    execute('INSERT INTO settings (key, value) VALUES (?, ?)', [row.key, row.value]);
  }

  saveDb();
  res.json({ ok: true, counts: {
    todos: data.todos?.length || 0,
    markdown: data.markdown_entries?.length || 0,
    reviews: data.daily_reviews?.length || 0,
    pomodoro: data.pomodoro_sessions?.length || 0,
    settings: data.settings?.length || 0,
  }});
});

module.exports = router;
