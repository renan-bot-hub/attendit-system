function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path || 'identifier'}`;
  }

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((item) => item.message)
      .filter(Boolean)
      .join('; ') || 'Validation failed';
  }

  if (err.code === 11000) {
    status = 409;
    const fields = Object.keys(err.keyPattern || err.keyValue || {});
    message = fields.length ? `${fields.join(', ')} already exists` : 'Duplicate record';
  }

  if (message.startsWith('CORS:')) {
    status = 403;
  }

  console.error(`[error] ${req.method} ${req.originalUrl}`, {
    status,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });

  res.status(status).json({ message });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
