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
      'Check the username/password in backend/.env against your MongoDB Atlas Database Access user.',
      'If the password contains special characters like @, :, /, ?, #, [, ], or %, URL-encode it before putting it in MONGO_URI.',
      `Original error: ${err.message}`,
    ].join('\n');
  }

  return `MongoDB connection error: ${err.message}`;
}

// Global variable to cache the Mongoose connection across serverless function invocations
let cachedConnection = null;

async function connectDB(options = {}) {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set. Add it to backend/.env or your deployment environment.');
  }

  // If a connection already exists, reuse it instead of opening a new one
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Reusing existing MongoDB connection');
    return cachedConnection;
  }

  const timeout = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || DEFAULT_SERVER_SELECTION_TIMEOUT_MS;

  try {
    console.log(`MongoDB connecting to ${describeMongoUri(process.env.MONGO_URI)}`);
    
    // Serverless-friendly optimization: Ensure Mongoose queues operations while connecting
    const opts = {
      serverSelectionTimeoutMS: timeout,
      bufferCommands: true, 
      ...options,
    };

    // Await the connection explicitly
    cachedConnection = await mongoose.connect(process.env.MONGO_URI, opts);
    console.log('MongoDB connected successfully');
    return cachedConnection;
  } catch (err) {
    err.message = formatMongoError(err);
    // Don't kill the server process in production/Vercel for intermittent connection blips
    if (!process.env.VERCEL) {
      throw err;
    } else {
      console.error(err.message);
    }
  }
}

module.exports = connectDB;
module.exports.describeMongoUri = describeMongoUri;
module.exports.formatMongoError = formatMongoError;
