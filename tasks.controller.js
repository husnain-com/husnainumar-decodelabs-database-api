const db = require('../db/database');
const { validateTaskInput } = require('../validators/task.validator');

// Base query: task + its category name (JOIN)
const SELECT_TASK = `
  SELECT t.id, t.title, t.description, t.priority, t.due_date, t.completed,
         t.category_id, c.name AS category_name, t.created_at, t.updated_at
  FROM tasks t
  LEFT JOIN categories c ON c.id = t.category_id`;

// Convert a database row into a clean API object
const toTask = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  priority: row.priority,
  dueDate: row.due_date,
  completed: row.completed === 1,
  category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const parseId = (value) => (/^\d+$/.test(value) ? Number(value) : null);

const findTask = (id) => db.prepare(`${SELECT_TASK} WHERE t.id = ?`).get(id);

const categoryExists = (id) =>
  id === null || Boolean(db.prepare('SELECT 1 FROM categories WHERE id = ?').get(id));

const idError = (res) =>
  res.status(400).json({ success: false, error: 'Task id must be a positive whole number' });

const notFound = (res, id) =>
  res.status(404).json({ success: false, error: `Task with id ${id} not found` });

// GET /api/tasks  (READ all)
const getAllTasks = (req, res) => {
  const rows = db.prepare(`${SELECT_TASK} ORDER BY t.id`).all();
  res.status(200).json({ success: true, count: rows.length, data: rows.map(toTask) });
};

// GET /api/tasks/:id  (READ one)
const getTaskById = (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return idError(res);

  const row = findTask(id);
  if (!row) return notFound(res, req.params.id);

  res.status(200).json({ success: true, data: toTask(row) });
};

// POST /api/tasks  (CREATE)
const createTask = (req, res) => {
  const { errors, value } = validateTaskInput(req.body);
  if (value && Number.isInteger(value.categoryId) && !categoryExists(value.categoryId)) {
    errors.push(`categoryId ${value.categoryId} does not exist`);
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }

  // Parameterized query: user input is never concatenated into SQL
  const result = db
    .prepare(
      `INSERT INTO tasks (title, description, priority, due_date, completed, category_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      value.title,
      value.description,
      value.priority,
      value.dueDate,
      value.completed ? 1 : 0,
      value.categoryId
    );

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: toTask(findTask(result.lastInsertRowid))
  });
};

// PUT /api/tasks/:id  (UPDATE - full replacement)
const updateTask = (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return idError(res);
  if (!findTask(id)) return notFound(res, req.params.id);

  const { errors, value } = validateTaskInput(req.body);
  if (value && Number.isInteger(value.categoryId) && !categoryExists(value.categoryId)) {
    errors.push(`categoryId ${value.categoryId} does not exist`);
  }
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, priority = ?, due_date = ?, completed = ?, category_id = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`
  ).run(
    value.title,
    value.description,
    value.priority,
    value.dueDate,
    value.completed ? 1 : 0,
    value.categoryId,
    id
  );

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: toTask(findTask(id))
  });
};

// DELETE /api/tasks/:id  (DELETE)
const deleteTask = (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return idError(res);

  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  if (result.changes === 0) return notFound(res, req.params.id);

  res.status(204).send();
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
