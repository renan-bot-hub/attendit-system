const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 300;

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}

function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS;
  const max = Number(options.max || process.env.RATE_LIMIT_MAX) || DEFAULT_MAX_REQUESTS;
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const key = forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(max - current.count, 0)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    next();
  };
}

module.exports = {
  securityHeaders,
  createRateLimiter,
};
