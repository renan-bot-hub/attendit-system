const mongoose = require('mongoose');

// Cache connection state globally across serverless invocations
let isConnected = false; 

async function connectDB() {
  // If already connected, reuse the active pool
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Reusing warm database connection instance');
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI missing from deployment environment variables.');
  }

  try {
    console.log('Initiating database connection handshake...');
    
    // Serverless-specific connection tuning
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Crash quickly (5s) instead of hanging the function
      bufferCommands: false,         // Turn off buffering to surface connection faults immediately
    });

    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected cleanly.');
  } catch (err) {
    console.error('Database connection failed directly:', err.message);
    isConnected = false;
    throw err; // Crucial: Throwing tells your endpoints that the DB is broken
  }
}

module.exports = connectDB;
