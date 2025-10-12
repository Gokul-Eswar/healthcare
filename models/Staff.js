const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  specialization: { type: String },
  status: { type: String, default: 'Available' },
  queue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);