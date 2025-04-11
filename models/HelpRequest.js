const mongoose = require("mongoose");

const helpRequestSchema = new mongoose.Schema({
  fullName: String,
  location: String,
  phone: String,
  helpType: String,
  peopleCount: Number,
  description: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HelpRequest", helpRequestSchema);
