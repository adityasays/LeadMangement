const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
  company: { type: String },
  city: { type: String },
  state: { type: String },
  source: { type: String, enum: ['website', 'facebook_ads', 'google_ads', 'referral', 'events', 'other'] },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'lost', 'won'], default: 'new' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  lead_value: { type: Number, default: 0 },
  last_activity_at: { type: Date },
  is_qualified: { type: Boolean, default: false },
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

leadSchema.index({ email: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ created_at: -1 });

leadSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Lead', leadSchema);