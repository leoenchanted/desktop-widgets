const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { queryAll, queryOne, execute } = require('../db/database');

const router = Router();
const WORKSPACE_DRAFT_KEY = 'workspace';

function countContent(content) {
  return {
    wordCount: content.trim() ? content.trim().split(/\s+/).length : 0,
    charCount: content.length,
  };
}

router.get('/', (req, res) => {
  const { date } = req.query;
  if (date) {
    const entry = queryOne('SELECT * FROM markdown_entries WHERE date = ?', [date]);
    if (!entry && date === WORKSPACE_DRAFT_KEY) {
      const latestEntry = queryOne(
        "SELECT * FROM markdown_entries WHERE content IS NOT NULL AND TRIM(content) != '' ORDER BY updated_at DESC, date DESC LIMIT 1"
      );
      if (latestEntry) {
        return res.json({ ...latestEntry, date: WORKSPACE_DRAFT_KEY, migrated_from: latestEntry.date });
      }
    }
    return res.json(entry || { date, content: '', word_count: 0, char_count: 0 });
  }
  const entries = queryAll('SELECT * FROM markdown_entries ORDER BY date DESC');
  res.json(entries);
});

router.put('/', (req, res) => {
  const { date, content } = req.body;
  if (!date || content === undefined) return res.status(400).json({ error: 'date and content required' });
  const { wordCount, charCount } = countContent(content);
  const id = uuidv4();
  const existing = queryOne('SELECT id FROM markdown_entries WHERE date = ?', [date]);
  if (existing) {
    execute(
      "UPDATE markdown_entries SET content = ?, word_count = ?, char_count = ?, updated_at = datetime('now','localtime') WHERE date = ?",
      [content, wordCount, charCount, date]
    );
  } else {
    execute(
      'INSERT INTO markdown_entries (id, date, content, word_count, char_count) VALUES (?, ?, ?, ?, ?)',
      [id, date, content, wordCount, charCount]
    );
  }
  const entry = queryOne('SELECT * FROM markdown_entries WHERE date = ?', [date]);
  res.json(entry);
});

module.exports = router;
