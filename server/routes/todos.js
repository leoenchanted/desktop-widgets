const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, execute } = require('../db/database');

const router = Router();

router.get('/', (req, res) => {
  const { date } = req.query;
  if (date) {
    const todos = queryAll(
      'SELECT * FROM todos WHERE date = ? ORDER BY sort_order, created_at',
      [date]
    );
    return res.json(todos);
  }
  const todos = queryAll('SELECT * FROM todos ORDER BY date DESC, sort_order');
  res.json(todos);
});

router.post('/', (req, res) => {
  const { date, text } = req.body;
  if (!date || !text) return res.status(400).json({ error: 'date and text required' });
  const id = uuidv4();
  execute(
    'INSERT INTO todos (id, date, text) VALUES (?, ?, ?)',
    [id, date, text]
  );
  const todo = queryOne('SELECT * FROM todos WHERE id = ?', [id]);
  res.status(201).json(todo);
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  if (req.body.text !== undefined) { fields.push('text = ?'); values.push(req.body.text); }
  if (req.body.completed !== undefined) { fields.push('completed = ?'); values.push(req.body.completed); }
  if (req.body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(req.body.sort_order); }
  if (fields.length === 0) return res.status(400).json({ error: 'no fields to update' });
  fields.push("updated_at = datetime('now','localtime')");
  values.push(id);
  execute(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values);
  const todo = queryOne('SELECT * FROM todos WHERE id = ?', [id]);
  res.json(todo);
});

router.delete('/:id', (req, res) => {
  execute('DELETE FROM todos WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

router.put('/reorder', (req, res) => {
  const { date, orderedIds } = req.body;
  orderedIds.forEach((id, index) => {
    execute('UPDATE todos SET sort_order = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ? AND date = ?', [index, id, date]);
  });
  res.json({ ok: true });
});

router.get('/dates', (req, res) => {
  const dates = queryAll('SELECT DISTINCT date FROM todos ORDER BY date DESC');
  res.json(dates.map(d => d.date));
});

module.exports = router;
