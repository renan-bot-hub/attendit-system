const mongoose = require('mongoose');

require('./env');

// Cache the connection pool and the connection promise globally across serverless invocations
let cachedConnection = null;
let cachedPromise = null;

async function connectDB() {
  // 1. If we already have a healthy connection, reuse it immediately
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // 2. If a connection is already in progress, make this request wait for it
  if (cachedPromise) {
    console.log('Waiting for existing database connection promise...');
    await cachedPromise;
    return mongoose;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing from environment variables.');
  }

  const timeout = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000;

  console.log('Initiating brand new MongoDB connection pool...');
  
  // 3. Save the connection promise globally so other incoming requests chain onto it
  cachedPromise = mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: timeout,
    bufferCommands: true, // Re-enable buffering now that we have a centralized promise tracking system
  }).then((mongooseInstance) => {
    console.log('MongoDB connection established successfully.');
    cachedConnection = mongooseInstance;
    return cachedConnection;
  }).catch((err) => {
    console.error('MongoDB connection promise rejected:', err.message);
    cachedPromise = null; // Reset on failure so the next request can retry
    throw err;
  });

  await cachedPromise;
  return mongoose;
}

module.exports = connectDB;
