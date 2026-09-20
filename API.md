# API Documentation

Base URL (local): `http://localhost:3000`

All responses are JSON (except `204 No Content`). Success responses contain `"success": true`; errors contain `"success": false` and an `error` message.

## Task object

```json
{
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
```

`category` is `null` when the task has no category.

## GET /api/health
**200** `{ "success": true, "status": "ok", "database": "connected" }` — **503** if the database is unavailable.

## GET /api/categories
**200** — list of categories with `taskCount`.
```json
{ "success": true, "count": 3, "data": [ { "id": 2, "name": "Study", "createdAt": "2026-09-20T07:52:05.746Z", "taskCount": 1 } ] }
```

## POST /api/categories
Body: `{ "name": "Personal" }` (2–50 characters)

| Status | When |
|--------|------|
| 201 | Category created |
| 400 | Validation failed |
| 409 | A category with that name already exists (case-insensitive) |

## GET /api/tasks
**200** — `{ "success": true, "count": 1, "data": [ ...task objects ] }`

## GET /api/tasks/:id

| Status | When |
|--------|------|
| 200 | Task found |
| 400 | id is not a positive whole number |
| 404 | Task not found |

## POST /api/tasks
Header: `Content-Type: application/json`

| Field | Required | Rule |
|-------|----------|------|
| title | Yes | String, 3–100 characters |
| description | No | String, up to 500 characters |
| priority | No | `low`, `medium`, `high` (default `medium`) |
| dueDate | No | Real date, `YYYY-MM-DD` |
| completed | No | Boolean (default `false`) |
| categoryId | No | Existing category id, or `null` |

| Status | When |
|--------|------|
| 201 | Task created |
| 400 | Validation failed, unknown categoryId, or malformed JSON |
| 413 | Body larger than 10 KB |

## PUT /api/tasks/:id
Replaces the task with the same body rules as POST (fields you omit reset to their defaults).

| Status | When |
|--------|------|
| 200 | Task updated |
| 400 | Invalid id, validation failed, or unknown categoryId |
| 404 | Task not found |

## DELETE /api/tasks/:id

| Status | When |
|--------|------|
| 204 | Task deleted (empty body) |
| 400 | Invalid id |
| 404 | Task not found |

## Errors

Unknown routes return **404**: `{ "success": false, "error": "Route not found: GET /nope" }`

Unexpected errors return **500**: `{ "success": false, "error": "Internal server error" }`
