process.env.DB_PATH = ':memory:'; // isolated temporary database for tests

const test = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');

let server;
let base;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => server.close());

const send = (method, url, body, raw = false) =>
  fetch(`${base}${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : raw ? body : JSON.stringify(body)
  });

test('GET /api/health confirms database is connected', async () => {
  const res = await send('GET', '/api/health');
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.database, 'connected');
});

test('GET /api/categories returns seeded categories', async () => {
  const res = await send('GET', '/api/categories');
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(json.count >= 3);
});

test('POST /api/categories creates (201) and rejects duplicate (409)', async () => {
  const ok = await send('POST', '/api/categories', { name: 'Personal' });
  assert.strictEqual(ok.status, 201);
  const dup = await send('POST', '/api/categories', { name: 'personal' });
  assert.strictEqual(dup.status, 409);
});

test('POST /api/categories with invalid name returns 400', async () => {
  const res = await send('POST', '/api/categories', { name: 'a' });
  assert.strictEqual(res.status, 400);
});

test('CREATE task returns 201 with category', async () => {
  const res = await send('POST', '/api/tasks', {
    title: 'Learn SQL joins',
    priority: 'HIGH',
    dueDate: '2026-12-31',
    categoryId: 2
  });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.data.priority, 'high');
  assert.strictEqual(json.data.category.name, 'Study');
  assert.strictEqual(json.data.completed, false);
});

test('READ: list and single task', async () => {
  const created = await (await send('POST', '/api/tasks', { title: 'Read me' })).json();
  const list = await (await send('GET', '/api/tasks')).json();
  assert.ok(list.count >= 1);
  const one = await send('GET', `/api/tasks/${created.data.id}`);
  assert.strictEqual(one.status, 200);
});

test('UPDATE task with PUT returns 200 and new values', async () => {
  const created = await (await send('POST', '/api/tasks', { title: 'Old title' })).json();
  const res = await send('PUT', `/api/tasks/${created.data.id}`, {
    title: 'New title',
    completed: true,
    priority: 'low'
  });
  const json = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(json.data.title, 'New title');
  assert.strictEqual(json.data.completed, true);
});

test('UPDATE non-existing task returns 404', async () => {
  const res = await send('PUT', '/api/tasks/9999', { title: 'Does not exist' });
  assert.strictEqual(res.status, 404);
});

test('UPDATE with invalid data returns 400', async () => {
  const created = await (await send('POST', '/api/tasks', { title: 'To update' })).json();
  const res = await send('PUT', `/api/tasks/${created.data.id}`, { title: 'x', completed: 'yes' });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.strictEqual(json.details.length, 2);
});

test('DELETE task returns 204, then 404 on read and on repeat delete', async () => {
  const created = await (await send('POST', '/api/tasks', { title: 'Delete me' })).json();
  const del = await send('DELETE', `/api/tasks/${created.data.id}`);
  assert.strictEqual(del.status, 204);
  assert.strictEqual((await send('GET', `/api/tasks/${created.data.id}`)).status, 404);
  assert.strictEqual((await send('DELETE', `/api/tasks/${created.data.id}`)).status, 404);
});

test('POST missing title returns 400', async () => {
  const res = await send('POST', '/api/tasks', { description: 'no title' });
  const json = await res.json();
  assert.strictEqual(res.status, 400);
  assert.ok(json.details.includes('title is required'));
});

test('POST with non-existing categoryId returns 400', async () => {
  const res = await send('POST', '/api/tasks', { title: 'Bad category', categoryId: 999 });
  assert.strictEqual(res.status, 400);
});

test('SQL injection text is stored as plain data and tables survive', async () => {
  const evil = "Robert'); DROP TABLE tasks;--";
  const res = await send('POST', '/api/tasks', { title: evil });
  const json = await res.json();
  assert.strictEqual(res.status, 201);
  assert.strictEqual(json.data.title, evil);
  const list = await send('GET', '/api/tasks');
  assert.strictEqual(list.status, 200);
});

test('malformed JSON returns 400', async () => {
  const res = await send('POST', '/api/tasks', '{"title": "broken"', true);
  assert.strictEqual(res.status, 400);
});

test('invalid id returns 400 and unknown route returns 404', async () => {
  assert.strictEqual((await send('GET', '/api/tasks/abc')).status, 400);
  assert.strictEqual((await send('GET', '/api/nope')).status, 404);
});
