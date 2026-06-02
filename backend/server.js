// Express + Mongoose entry point.
// Loads .env, builds the app, mounts every /api/* route module,
// connects to MongoDB, trains the TensorFlow attendance risk model,
// and listens on PORT.

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

require("./config/env");

const connectDB = require("./config/db");
const {
  securityHeaders,
  createRateLimiter,
} = require("./middleware/securityMiddleware");
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const caseRoutes = require("./routes/caseRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const aiAlertRoutes = require("./routes/aiAlertRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const documentRoutes = require("./routes/documentRoutes");
const conferenceRoutes = require("./routes/conferenceRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const qrRoutes = require("./routes/qrRoutes");

const { trainRiskModel } = require("./utils/riskAi");

const app = express();

app.set("trust proxy", 1);

app.use(securityHeaders);
app.use(createRateLimiter());

const defaultDev = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "http://localhost:5180",
];

const mobileDev = [
  "http://10.0.2.2:5000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
];

const fromEnv = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultDev, ...mobileDev, ...fromEnv])];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS: origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.json({
    app: "Attend-IT Backend API",
    status: "running",
    health: "/api/health",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Attend-IT Backend API",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
    tensorflow: "attendance risk model enabled",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai-alerts", aiAlertRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/conferences", conferenceRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/qr", qrRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

if (!process.env.MONGO_URI) {
  console.error(
    "FATAL: MONGO_URI is not set. Add it to .env local or Render env vars."
  );
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    try {
      await trainRiskModel();
    } catch (aiError) {
      console.error("TensorFlow risk model failed to train:", aiError.message);
      console.log(
        "Server will continue running, but AI risk prediction may be unavailable."
      );
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Set PORT to a free port or stop the other process.`
        );
        process.exit(1);
      }

      throw err;
    });
  } catch (err) {
    console.error("Server startup failed:", err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };