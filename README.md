# DecodeLabs Database API

A REST API with a persistent SQLite database, built for **DecodeLabs Full Stack Development — Project 3: Database Integration**.

The API manages tasks that belong to categories. Data is stored in a real database, so it survives server restarts. All four CRUD operations are supported.

## Features

- Simple relational schema with two tables (one category has many tasks)
- Full CRUD on tasks: Create, Read, Update, Delete
- Database-level constraints: `PRIMARY KEY`, `FOREIGN KEY`, `NOT NULL`, `UNIQUE`, `CHECK`
- Parameterized queries everywhere (protection against SQL injection)
- Server-side validation before any data reaches the database
- Correct HTTP status codes: 200, 201, 204, 400, 404, 409, 413, 500
- Consistent JSON responses and centralized error handling
- Automated tests (15) using Node's built-in test runner

## Technologies

- Node.js (18+)
- Express.js 4
- SQLite via `better-sqlite3` (native driver, raw SQL)

## Database Schema

```
categories (1) ────< (many) tasks
```

| Table | Column | Type | Constraints |
|-------|--------|------|-------------|
| categories | id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| categories | name | TEXT | NOT NULL, UNIQUE, CHECK length 2–50 |
| categories | created_at | TEXT | NOT NULL, default current time |
| tasks | id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| tasks | title | TEXT | NOT NULL, CHECK length 3–100 |
| tasks | description | TEXT | NOT NULL, default empty, CHECK max 500 |
| tasks | priority | TEXT | NOT NULL, CHECK in (low, medium, high) |
| tasks | due_date | TEXT | optional (YYYY-MM-DD) |
| tasks | completed | INTEGER | NOT NULL, CHECK in (0, 1) |
| tasks | category_id | INTEGER | FOREIGN KEY → categories(id), ON DELETE SET NULL |
| tasks | created_at / updated_at | TEXT | NOT NULL, default current time |

The full SQL is in [`src/db/schema.sql`](src/db/schema.sql). Tables are created automatically on first start, and three default categories (General, Study, Work) are added.

## CRUD Mapping

| Operation | HTTP | SQL |
|-----------|------|-----|
| Create | POST | INSERT |
| Read | GET | SELECT |
| Update | PUT | UPDATE |
| Delete | DELETE | DELETE |

## Project Structure

```
decodelabs-database-api/
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── docs/API.md
├── src/
│   ├── app.js
│   ├── db/
│   │   ├── database.js        # Connection, schema setup, seed data
│   │   └── schema.sql         # Table definitions and constraints
│   ├── routes/
│   │   ├── tasks.routes.js
│   │   └── categories.routes.js
│   ├── controllers/
│   │   ├── tasks.controller.js
│   │   └── categories.controller.js
│   ├── validators/
│   │   ├── task.validator.js
│   │   └── category.validator.js
│   └── middleware/errorHandler.js
└── tests/api.test.js
```

## Installation

```bash
git clone <your-repository-url>
cd husnainumar-decodelabs-database-api
npm install
```

## Run the Server

```bash
npm start
```

Runs at `http://localhost:3000`. The database file is created at `data/app.db` (ignored by Git). See `.env.example` for `PORT` and `DB_PATH`.

## Run the Tests

```bash
npm test
```

Tests use a temporary in-memory database, so your real data is never touched.

## API Endpoints

| Method | URL | Description | Success |
|--------|-----|-------------|---------|
| GET | `/api/health` | Health check + database status | 200 |
| GET | `/api/categories` | List categories with task counts | 200 |
| POST | `/api/categories` | Create a category | 201 |
| GET | `/api/tasks` | List all tasks | 200 |
| GET | `/api/tasks/:id` | Get one task | 200 |
| POST | `/api/tasks` | Create a task | 201 |
| PUT | `/api/tasks/:id` | Update a task (full replacement) | 200 |
| DELETE | `/api/tasks/:id` | Delete a task | 204 |

Full details: [docs/API.md](docs/API.md)

### Example requests

```bash
# Create
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish Project 3","description":"Database integration","priority":"high","dueDate":"2026-10-05","categoryId":2}'

# Read
curl http://localhost:3000/api/tasks/1

# Update
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Finish Project 3","priority":"high","completed":true,"categoryId":2}'

# Delete
curl -X DELETE http://localhost:3000/api/tasks/1
```

### Example success response (201 Created)

```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": 1,
    "title": "Finish Project 3",
    "description": "Database integration",
    "priority": "high",
    "dueDate": "2026-10-05",
    "completed": false,
    "category": { "id": 2, "name": "Study" },
    "createdAt": "2026-09-20T07:51:47.981Z",
    "updatedAt": "2026-09-20T07:51:47.981Z"
  }
}
```

### Example validation error response (400 Bad Request)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "title must be between 3 and 100 characters",
    "categoryId 99 does not exist"
  ]
}
```

## Data Handling and Security

- **Validation first:** input is checked in the validators before any query runs.
- **Constraints as a second layer:** the database itself rejects invalid values (`NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY`).
- **Parameterized queries:** user input is passed as `?` parameters, never concatenated into SQL. A test confirms that `Robert'); DROP TABLE tasks;--` is stored as plain text and the tables stay intact.
- **Referential integrity:** foreign keys are enabled; deleting a category never leaves tasks pointing to nothing.

## Project Requirements Fulfilled

- Design a simple database schema (two related tables with keys and constraints)
- Perform basic CRUD operations (INSERT, SELECT, UPDATE, DELETE through the API)
- Ensure proper data handling (validation, constraints, parameterized queries, status codes, error handling)
- Data persists across server restarts

## Note on Hosting

SQLite stores data in a file. On free hosting platforms the disk is temporary, so the file can reset on redeploy. For permanent hosted data, use a host with a persistent disk or switch the data layer to a hosted database.

## Author

Husnain Umar — BS Computer Science graduate, MERN stack developer.
