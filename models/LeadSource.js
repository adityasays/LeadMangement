const mongoose = require('mongoose');

const leadSourceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LeadSource', leadSourceSchema);