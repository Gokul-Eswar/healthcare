const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  complaint: { type: String, required: true },
  vitals: { type: String },
  triageLevel: { type: Number },
  queueNumber: { type: Number },
  doctor: { type: String },
  status: { type: String, default: 'awaiting-triage' },
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);