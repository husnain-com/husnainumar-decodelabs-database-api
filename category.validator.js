const validateCategoryInput = (body) => {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return {
      errors: ['Request body must be a JSON object (send Content-Type: application/json)'],
      value: null
    };
  }

  const errors = [];
  let name = body.name;

  if (name === undefined || name === null || name === '') {
    errors.push('name is required');
  } else if (typeof name !== 'string') {
    errors.push('name must be a string');
  } else {
    name = name.trim();
    if (name.length < 2 || name.length > 50) {
      errors.push('name must be between 2 and 50 characters');
    }
  }

  return { errors, value: { name } };
};

module.exports = { validateCategoryInput };
