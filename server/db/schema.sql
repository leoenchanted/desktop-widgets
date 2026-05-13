CREATE TABLE IF NOT EXISTS todos (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  text        TEXT NOT NULL,
  completed   INTEGER DEFAULT 0,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now','localtime')),
  updated_at  TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_todos_date ON todos(date);

CREATE TABLE IF NOT EXISTS markdown_entries (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL UNIQUE,
  content     TEXT NOT NULL DEFAULT '',
  word_count  INTEGER DEFAULT 0,
  char_count  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now','localtime')),
  updated_at  TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_markdown_date ON markdown_entries(date);

CREATE TABLE IF NOT EXISTS daily_reviews (
  id                  TEXT PRIMARY KEY,
  date                TEXT NOT NULL UNIQUE,
  notes               TEXT DEFAULT '',
  todo_completed      INTEGER DEFAULT 0,
  todo_total          INTEGER DEFAULT 0,
  markdown_word_count INTEGER DEFAULT 0,
  pomodoro_count      INTEGER DEFAULT 0,
  generated_at        TEXT,
  created_at          TEXT DEFAULT (datetime('now','localtime')),
  updated_at          TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON daily_reviews(date);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id          TEXT PRIMARY KEY,
  date        TEXT NOT NULL,
  duration    INTEGER NOT NULL,
  completed   INTEGER DEFAULT 0,
  started_at  TEXT,
  ended_at    TEXT,
  created_at  TEXT DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_pomodo_date ON pomodoro_sessions(date);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
