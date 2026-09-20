const PRIORITIES = ['low', 'medium', 'high'];

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

/**
 * Validates the body for POST /api/tasks and PUT /api/tasks/:id.
 * Returns { errors: [...], value: {...} }
 */
const validateTaskInput = (body) => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      errors: ['Request body must be a JSON object (send Content-Type: application/json)'],
      value: null
    };
  }

  const errors = [];

  // title: required string, 3-100 chars
  let title = body.title;
  if (title === undefined || title === null || title === '') {
    errors.push('title is required');
  } else if (typeof title !== 'string') {
    errors.push('title must be a string');
  } else {
    title = title.trim();
    if (title.length < 3 || title.length > 100) {
      errors.push('title must be between 3 and 100 characters');
    }
  }

  // description: optional string, max 500 chars
  let description = body.description;
  if (description === undefined || description === null) {
    description = '';
  } else if (typeof description !== 'string') {
    errors.push('description must be a string');
  } else {
    description = description.trim();
    if (description.length > 500) {
      errors.push('description must be 500 characters or fewer');
    }
  }

  // priority: optional, low | medium | high (default medium)
  let priority = body.priority;
  if (priority === undefined || priority === null) {
    priority = 'medium';
  } else if (typeof priority !== 'string' || !PRIORITIES.includes(priority.toLowerCase())) {
    errors.push(`priority must be one of: ${PRIORITIES.join(', ')}`);
  } else {
    priority = priority.toLowerCase();
  }

  // dueDate: optional, YYYY-MM-DD real calendar date
  let dueDate = body.dueDate;
  if (dueDate === undefined || dueDate === null) {
    dueDate = null;
  } else if (typeof dueDate !== 'string' || !isValidDate(dueDate)) {
    errors.push('dueDate must be a valid date in YYYY-MM-DD format');
  }

  // completed: optional boolean (default false)
  let completed = body.completed;
  if (completed === undefined || completed === null) {
    completed = false;
  } else if (typeof completed !== 'boolean') {
    errors.push('completed must be true or false');
  }

  // categoryId: optional positive integer or null
  let categoryId = body.categoryId;
  if (categoryId === undefined || categoryId === null) {
    categoryId = null;
  } else if (!Number.isInteger(categoryId) || categoryId < 1) {
    errors.push('categoryId must be a positive whole number');
  }

  return { errors, value: { title, description, priority, dueDate, completed, categoryId } };
};

module.exports = { validateTaskInput };
