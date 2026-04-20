const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Ensure this is at the top!

const authRoutes = require('./routes/authRoutes');

const app = express();

// 1. MIDDLEWARE
app.use(express.json());
app.use(cors()); // This must be ABOVE the routes

// 2. REQUEST LOGGER (To help us debug)
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to: ${req.url}`);
  next();
});

// 3. ROUTES
app.use('/api/auth', authRoutes);

// 4. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));