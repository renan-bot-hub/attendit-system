// Express + Mongoose entry point. Loads .env, builds the app, mounts
// every /api/* route module, connects to MongoDB, and listens on PORT.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes         = require('./routes/authRoutes');
const attendanceRoutes   = require('./routes/attendanceRoutes');
const userRoutes         = require('./routes/userRoutes');
const sessionRoutes      = require('./routes/sessionRoutes');
const messageRoutes      = require('./routes/messageRoutes');
const caseRoutes         = require('./routes/caseRoutes');
const settingsRoutes     = require('./routes/settingsRoutes');
const aiAlertRoutes      = require('./routes/aiAlertRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const documentRoutes     = require('./routes/documentRoutes');
const conferenceRoutes   = require('./routes/conferenceRoutes');
const sectionRoutes      = require('./routes/sectionRoutes');

const app = express();
app.set('trust proxy', 1);

// Allow all localhost dev ports (5173-5180) + any configured CLIENT_ORIGIN
const defaultDev = [
  'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
  'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178',
  'http://localhost:5179', 'http://localhost:5180',
];
const fromEnv = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultDev, ...fromEnv])];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth',          authRoutes);
app.use('/api/attendance',    attendanceRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/sessions',      sessionRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/cases',         caseRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/ai-alerts',     aiAlertRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/documents',     documentRoutes);
app.use('/api/conferences',   conferenceRoutes);
app.use('/api/sections',      sectionRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

if (!process.env.MONGO_URI) {
  console.error('FATAL: MONGO_URI is not set. Add it to .env (local) or Render env vars.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set.');
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');

    const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set PORT to a free port or stop the other process.`);
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

start();
