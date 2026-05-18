const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db/database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/todos', require('./routes/todos'));
app.use('/api/markdown', require('./routes/markdown'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/wallpaper', require('./routes/wallpaper'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Initialize database then start server
async function start() {
  try {
    await getDb();
    console.log('Database initialized');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize:', err);
    process.exit(1);
  }
}

start();
