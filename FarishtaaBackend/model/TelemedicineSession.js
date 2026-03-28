const mongoose = require('mongoose');

const telemedicineSessionSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

telemedicineSessionSchema.index({ doctor: 1, lastMessageAt: -1 });
telemedicineSessionSchema.index({ patient: 1, lastMessageAt: -1 });
telemedicineSessionSchema.index({ appointment: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('TelemedicineSession', telemedicineSessionSchema);
