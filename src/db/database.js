const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'data', 'app.db');

if (dbPath !== ':memory:') {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

// Enforce foreign keys (SQLite has them off by default)
db.pragma('foreign_keys = ON');

// Create tables if they do not exist yet
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

// Seed default categories once
const { count } = db.prepare('SELECT COUNT(*) AS count FROM categories').get();
if (count === 0) {
  const insert = db.prepare('INSERT INTO categories (name) VALUES (?)');
  ['General', 'Study', 'Work'].forEach((name) => insert.run(name));
}

module.exports = db;
