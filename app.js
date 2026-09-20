const express = require('express');
const db = require('./db/database');
const taskRoutes = require('./routes/tasks.routes');
const categoryRoutes = require('./routes/categories.routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json({ limit: '10kb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DecodeLabs Database API is running',
    endpoints: {
      health: 'GET /api/health',
      categories: 'GET, POST /api/categories',
      tasks: 'GET, POST /api/tasks',
      task: 'GET, PUT, DELETE /api/tasks/:id'
    }
  });
});

// Health check (also verifies the database connection)
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.status(200).json({ success: true, status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ success: false, status: 'error', database: 'unavailable' });
  }
});

app.use('/api/categories', categoryRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
