const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Invalid JSON in request body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, error: 'Request body is too large' });
  }

  // Database constraint violations (UNIQUE, CHECK, FOREIGN KEY, NOT NULL)
  if (typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT')) {
    return res.status(409).json({ success: false, error: 'Database constraint violated' });
  }

  console.error(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
};

module.exports = { notFound, errorHandler };
