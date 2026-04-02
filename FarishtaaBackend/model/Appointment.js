const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentDate: { type: String, required: true }, // YYYY-MM-DD
    slotTime: { type: String, required: true },
    appointmentAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed', 'closed'],
      default: 'pending',
    },
    appointmentFor: {
      type: String,
      enum: ['self', 'relative'],
      default: 'self',
    },
    relativeDetails: {
      name: { type: String, trim: true, maxlength: 120 },
      age: { type: Number, min: 0, max: 130 },
      relation: { type: String, trim: true, maxlength: 60 },
      importantNotes: { type: String, trim: true, maxlength: 300 },
    },
    reason: { type: String },
    meetingType: { type: String, enum: ['online', 'in-person'], default: 'online' },
    doctorResponseNote: { type: String },
    telemedicineSession: { type: mongoose.Schema.Types.ObjectId, ref: 'TelemedicineSession' },
    paymentRequired: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ['not_required', 'pending', 'paid', 'failed', 'refunded'],
      default: 'not_required',
    },
    paymentProvider: { type: String },
    paymentOrderId: { type: String },
    paymentId: { type: String },
    paymentAmount: { type: Number },
    paymentCurrency: { type: String, default: 'INR' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, appointmentDate: 1, slotTime: 1 });
appointmentSchema.index({ patient: 1, appointmentAt: -1 });
appointmentSchema.index({ doctor: 1, appointmentAt: -1 });
appointmentSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
