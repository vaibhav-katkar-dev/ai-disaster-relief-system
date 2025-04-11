const mongoose = require('mongoose');

const DisasterSchema = new mongoose.Schema({
  type: String,
  severity: String,
  location: {
    lat: Number,
    lng: Number
  },
  description: String,
  reportedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Disaster', DisasterSchema);
