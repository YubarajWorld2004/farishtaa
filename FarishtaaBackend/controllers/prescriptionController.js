const path = require('path');
const Prescription = require('../model/Prescription');
const Appointment = require('../model/Appointment');
const User = require('../model/User');

const parseMedicines = (medicinesInput) => {
  if (!medicinesInput) return [];

  let parsed = medicinesInput;
  if (typeof medicinesInput === 'string') {
    try {
      parsed = JSON.parse(medicinesInput);
    } catch (error) {
      return null;
    }
  }

  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((item) => item && typeof item === 'object' && item.name)
    .map((item) => ({
      name: String(item.name).trim(),
      dosage: item.dosage ? String(item.dosage).trim() : '',
      frequency: item.frequency ? String(item.frequency).trim() : '',
      duration: item.duration ? String(item.duration).trim() : '',
      instructions: item.instructions ? String(item.instructions).trim() : '',
    }))
    .filter((item) => item.name);
};

const buildFileObject = (file) => {
  if (!file) return undefined;

  return {
    fileName: file.originalname,
    fileUrl: `/uploads/${path
      .relative(path.join(__dirname, '..', 'uploads'), file.path)
      .split(path.sep)
      .join('/')}`,
    mimeType: file.mimetype,
    size: file.size,
  };
};

exports.createPrescription = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, appointmentId, diagnosis, notes } = req.body;

    const medicines = parseMedicines(req.body.medicines);
    if (medicines === null) {
      return res.status(400).json({ message: 'Invalid medicines payload' });
    }

    let resolvedPatientId = patientId;

    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

      if (String(appointment.doctor) !== String(doctorId)) {
        return res.status(403).json({ message: 'You can only create prescriptions for your own appointments' });
      }

      resolvedPatientId = resolvedPatientId || String(appointment.patient);

      if (resolvedPatientId && String(appointment.patient) !== String(resolvedPatientId)) {
        return res.status(400).json({ message: 'Patient does not match appointment' });
      }
    }

    if (!resolvedPatientId) {
      return res.status(400).json({ message: 'patientId is required (or provide appointmentId)' });
    }

    const patient = await User.findOne({ _id: resolvedPatientId, userType: 'Patient' }).select('_id');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const prescription = await Prescription.create({
      doctor: doctorId,
      patient: resolvedPatientId,
      appointment: appointmentId || undefined,
      diagnosis: diagnosis ? String(diagnosis).trim() : '',
      notes: notes ? String(notes).trim() : '',
      medicines,
      file: buildFileObject(req.file),
    });

    const populated = await Prescription.findById(prescription._id)
      .populate({ path: 'doctor', select: 'firstName lastName specialist' })
      .populate({ path: 'patient', select: 'firstName lastName age gender' })
      .populate({ path: 'appointment', select: 'appointmentDate slotTime status' });

    return res.status(201).json({ message: 'Prescription created', prescription: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create prescription', error: error.message });
  }
};

exports.getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.userId })
      .populate({ path: 'doctor', select: 'firstName lastName specialist clinicName' })
      .populate({ path: 'appointment', select: 'appointmentDate slotTime status' })
      .sort({ issuedAt: -1 });

    return res.status(200).json({ prescriptions });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
};

exports.getPatientPrescriptionById = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const prescription = await Prescription.findById(prescriptionId)
      .populate({ path: 'doctor', select: 'firstName lastName specialist clinicName' })
      .populate({ path: 'appointment', select: 'appointmentDate slotTime status' });

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    if (String(prescription.patient) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.status(200).json({ prescription });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch prescription', error: error.message });
  }
};

exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ doctor: req.userId })
      .populate({ path: 'patient', select: 'firstName lastName age gender' })
      .populate({ path: 'appointment', select: 'appointmentDate slotTime status' })
      .sort({ issuedAt: -1 });

    return res.status(200).json({ prescriptions });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
  }
};
