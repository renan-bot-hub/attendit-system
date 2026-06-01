// Connects Mongoose to MongoDB and formats common connection errors.
const mongoose = require('mongoose');

require('./env');

const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 10000;

function describeMongoUri(uri) {
  if (!uri) return 'not configured';

  const withoutCredentials = uri.replace(/\/\/([^:/?#]+)(?::([^@/?#]*))?@/, '//<user>:<password>@');

  try {
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@]+@)?([^/?]+)(\/([^?]+))?/i);
    if (!match) return withoutCredentials;

    const hosts = match[1]
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean);
    const database = match[3] || '(default database)';

    return `${hosts[0]}${hosts.length > 1 ? ` (+${hosts.length - 1} more)` : ''}/${database}`;
  } catch {
    return withoutCredentials;
  }
}

function isBadAuthError(err) {
  const message = String(err && err.message ? err.message : err).toLowerCase();

  return (
    err?.code === 18 ||
    err?.code === 8000 ||
    message.includes('bad auth') ||
    message.includes('authentication failed') ||
    message.includes('auth failed')
  );
}

function formatMongoError(err) {
  if (isBadAuthError(err)) {
    return [
      `MongoDB authentication failed while connecting to ${describeMongoUri(process.env.MONGO_URI)}.`,
      'Check the username/password in attendit-backend/.env against your MongoDB Atlas Database Access user.',
      'If the password contains special characters like @, :, /, ?, #, [, ], or %, URL-encode it before putting it in MONGO_URI.',
      `Original error: ${err.message}`,
    ].join('\n');
  }

  return `MongoDB connection error: ${err.message}`;
}

async function connectDB(options = {}) {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Add it to attendit-backend/.env or your deployment environment.');
  }

  const timeout = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || DEFAULT_SERVER_SELECTION_TIMEOUT_MS;

  try {
    console.log(`MongoDB connecting to ${describeMongoUri(process.env.MONGO_URI)}`);
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: timeout,
      ...options,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    err.message = formatMongoError(err);
    throw err;
  }
}

module.exports = connectDB;
module.exports.describeMongoUri = describeMongoUri;
module.exports.formatMongoError = formatMongoError;
