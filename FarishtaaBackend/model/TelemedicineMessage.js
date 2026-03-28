const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const telemedicineMessageSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'TelemedicineSession', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderType: { type: String, enum: ['Doctor', 'Patient'], required: true },
    content: { type: String, default: '' },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

telemedicineMessageSchema.index({ session: 1, createdAt: 1 });

module.exports = mongoose.model('TelemedicineMessage', telemedicineMessageSchema);
