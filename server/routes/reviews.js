const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, execute } = require('../db/database');

const router = Router();

router.get('/', (req, res) => {
  const { date } = req.query;
  if (date) {
    const review = queryOne('SELECT * FROM daily_reviews WHERE date = ?', [date]);
    return res.json(review || null);
  }
  const reviews = queryAll('SELECT * FROM daily_reviews ORDER BY date DESC');
  res.json(reviews);
});

router.post('/generate', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });

  const todos = queryAll('SELECT * FROM todos WHERE date = ?', [date]);
  const todoCompleted = todos.filter(t => t.completed).length;
  const todoTotal = todos.length;
  const md = queryOne('SELECT * FROM markdown_entries WHERE date = ?', [date]);
  const pomodoroCount = queryOne(
    'SELECT COUNT(*) as count FROM pomodoro_sessions WHERE date = ? AND completed = 1',
    [date]
  );

  const existing = queryOne('SELECT id FROM daily_reviews WHERE date = ?', [date]);
  if (existing) {
    execute(
      "UPDATE daily_reviews SET todo_completed = ?, todo_total = ?, markdown_word_count = ?, pomodoro_count = ?, generated_at = datetime('now','localtime'), updated_at = datetime('now','localtime') WHERE date = ?",
      [todoCompleted, todoTotal, md?.word_count || 0, pomodoroCount.count, date]
    );
  } else {
    execute(
      'INSERT INTO daily_reviews (id, date, todo_completed, todo_total, markdown_word_count, pomodoro_count, generated_at) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\',\'localtime\'))',
      [uuidv4(), date, todoCompleted, todoTotal, md?.word_count || 0, pomodoroCount.count]
    );
  }

  const review = queryOne('SELECT * FROM daily_reviews WHERE date = ?', [date]);
  res.json(review);
});

router.put('/', (req, res) => {
  const { date, notes } = req.body;
  if (!date || notes === undefined) return res.status(400).json({ error: 'date and notes required' });
  const existing = queryOne('SELECT id FROM daily_reviews WHERE date = ?', [date]);
  if (existing) {
    execute(
      "UPDATE daily_reviews SET notes = ?, updated_at = datetime('now','localtime') WHERE date = ?",
      [notes, date]
    );
  } else {
    execute(
      'INSERT INTO daily_reviews (id, date, notes) VALUES (?, ?, ?)',
      [uuidv4(), date, notes]
    );
  }
  const review = queryOne('SELECT * FROM daily_reviews WHERE date = ?', [date]);
  res.json(review);
});

module.exports = router;
