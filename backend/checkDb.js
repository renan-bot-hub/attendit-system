// Command-line health check that verifies MongoDB can be reached.
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { envPath } = require('./config/env');

async function checkDb() {
  let exitCode = 0;

  try {
    console.log(`Using env file: ${envPath}`);
    await connectDB({ serverSelectionTimeoutMS: 5000 });
    await mongoose.connection.db.admin().ping();
    console.log('MongoDB ping succeeded');
  } catch (err) {
    console.error(err.message);
    exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
    process.exit(exitCode);
  }
}

checkDb();
