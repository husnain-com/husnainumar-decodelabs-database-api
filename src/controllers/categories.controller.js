const db = require('../db/database');
const { validateCategoryInput } = require('../validators/category.validator');

// GET /api/categories  (READ)
const getAllCategories = (req, res) => {
  const rows = db
    .prepare(
      `SELECT c.id, c.name, c.created_at AS createdAt, COUNT(t.id) AS taskCount
       FROM categories c
       LEFT JOIN tasks t ON t.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id`
    )
    .all();

  res.status(200).json({ success: true, count: rows.length, data: rows });
};

// POST /api/categories  (CREATE)
const createCategory = (req, res) => {
  const { errors, value } = validateCategoryInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ success: false, error: 'Validation failed', details: errors });
  }

  const existing = db.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(value.name);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Category "${value.name}" already exists`
    });
  }

  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(value.name);
  const category = db
    .prepare('SELECT id, name, created_at AS createdAt FROM categories WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json({ success: true, message: 'Category created successfully', data: category });
};

module.exports = { getAllCategories, createCategory };
