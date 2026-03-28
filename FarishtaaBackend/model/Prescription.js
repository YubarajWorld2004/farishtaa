const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String },
    frequency: { type: String },
    duration: { type: String },
    instructions: { type: String },
  },
  { _id: false }
);

const prescriptionFileSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    diagnosis: { type: String },
    medicines: [medicineSchema],
    notes: { type: String },
    file: prescriptionFileSchema,
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, issuedAt: -1 });
prescriptionSchema.index({ doctor: 1, issuedAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
