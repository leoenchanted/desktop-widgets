const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, execute } = require('../db/database');

const router = Router();

router.get('/', (req, res) => {
  const { date } = req.query;
  if (date) {
    const sessions = queryAll(
      'SELECT * FROM pomodoro_sessions WHERE date = ? ORDER BY created_at',
      [date]
    );
    return res.json(sessions);
  }
  const sessions = queryAll('SELECT * FROM pomodoro_sessions ORDER BY date DESC, created_at');
  res.json(sessions);
});

router.post('/', (req, res) => {
  const { date, duration } = req.body;
  if (!date || !duration) return res.status(400).json({ error: 'date and duration required' });
  const id = uuidv4();
  execute(
    "INSERT INTO pomodoro_sessions (id, date, duration, completed, started_at, ended_at) VALUES (?, ?, ?, 1, datetime('now','localtime'), datetime('now','localtime'))",
    [id, date, duration]
  );
  const session = queryOne('SELECT * FROM pomodoro_sessions WHERE id = ?', [id]);
  res.status(201).json(session);
});

module.exports = router;
