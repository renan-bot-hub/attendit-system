const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  className: String,
  date: Date,
  active: Boolean,
});

module.exports = mongoose.model("Session", sessionSchema);
