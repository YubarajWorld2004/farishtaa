const crypto = require('crypto');
const Razorpay = require('razorpay');
const Appointment = require('../model/Appointment');
const TelemedicineSession = require('../model/TelemedicineSession');
const User = require('../model/User');
const { createNotification } = require('../service/notificationService');
const {
  buildSlotsFromAvailability,
  toDateTimeFromDateAndLabel,
} = require('../utils/slotUtils');

const BOOKED_STATUSES = ['pending', 'accepted'];
const DOCTOR_STATUS_UPDATES = ['accepted', 'rejected', 'completed', 'closed'];
const TERMINAL_APPOINTMENT_STATUSES = ['rejected', 'completed', 'closed'];
const RAZORPAY_CURRENCY = 'INR';
const APPOINTMENT_STATUS_MESSAGES = {
  accepted: 'accepted your appointment request',
  rejected: 'rejected your appointment request',
  completed: 'marked your appointment as completed',
  closed: 'closed your appointment',
};

const formatPersonName = (profile, fallback) =>
  `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || fallback;

const safeReasonPreview = (reason) => {
  const trimmed = String(reason || '').trim();
  if (!trimmed) return '';
  if (trimmed.length > 90) return `${trimmed.slice(0, 87)}...`;
  return trimmed;
};

const sanitizeText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const parseAppointmentAudience = ({
  appointmentFor,
  relativeName,
  relativeAge,
  relativeRelation,
  relativeImportantThings,
}) => {
  const bookingTarget = appointmentFor === 'relative' ? 'relative' : 'self';

  if (bookingTarget !== 'relative') {
    return {
      appointmentFor: 'self',
      relativeDetails: undefined,
    };
  }

  const name = sanitizeText(relativeName, 120);
  const relation = sanitizeText(relativeRelation, 60);
  const importantNotes = sanitizeText(relativeImportantThings, 300);
  const parsedAge = Number.parseInt(relativeAge, 10);

  if (!name) {
    throw createRequestError(400, 'Relative name is required when booking for relative');
  }

  if (!Number.isFinite(parsedAge) || parsedAge < 0 || parsedAge > 130) {
    throw createRequestError(400, 'Relative age must be between 0 and 130');
  }

  return {
    appointmentFor: 'relative',
    relativeDetails: {
      name,
      age: parsedAge,
      relation: relation || undefined,
      importantNotes: importantNotes || undefined,
    },
  };
};

const getRelativeDescriptor = (appointment) => {
  if (appointment?.appointmentFor !== 'relative') return '';

  const relativeName = sanitizeText(appointment?.relativeDetails?.name, 80);
  const age = Number.parseInt(appointment?.relativeDetails?.age, 10);
  const agePart = Number.isFinite(age) ? `, age ${age}` : '';

  if (relativeName) {
    return ` for ${relativeName}${agePart}`;
  }

  return ' for a relative';
};

const notifyDoctorAboutNewAppointment = async ({ appointment, patientProfile, patientId, reason }) => {
  const patientName = formatPersonName(patientProfile, 'A patient');
  const reasonPreview = safeReasonPreview(reason);
  const relativeDescriptor = getRelativeDescriptor(appointment);

  await createNotification({
    recipientId: appointment.doctor,
    senderId: patientId,
    type: 'appointment_status',
    title: 'New appointment request',
    message: `${patientName} requested an appointment${relativeDescriptor} on ${appointment.appointmentDate} at ${appointment.slotTime}.${
      reasonPreview ? ` Reason: ${reasonPreview}` : ''
    }`,
    meta: {
      appointmentId: appointment._id,
      status: appointment.status,
      appointmentDate: appointment.appointmentDate,
      slotTime: appointment.slotTime,
      meetingType: appointment.meetingType,
      route: '/doctor-dashboard/appointments',
    },
  });
};

let razorpayClient = null;

const createRequestError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getRazorpayClient = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    return null;
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayClient;
};

const parseDoctorFee = (doctor) => {
  const fee = Number(doctor?.fee || 0);
  if (!Number.isFinite(fee) || fee <= 0) return 0;
  return Number(fee.toFixed(2));
};

const validateDateString = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
};

const parsePagination = (pageValue, limitValue, defaultLimit = 20, maxLimit = 100) => {
  const parsedPage = Number.parseInt(pageValue, 10);
  const parsedLimit = Number.parseInt(limitValue, 10);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, maxLimit)
    : defaultLimit;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getValidatedBookingContext = async ({ patientId, doctorId, appointmentDate, slotTime }) => {
  if (!doctorId || !validateDateString(appointmentDate) || !slotTime) {
    throw createRequestError(
      400,
      'doctorId, appointmentDate (YYYY-MM-DD), and slotTime are required'
    );
  }

  const [doctor, patient] = await Promise.all([
    User.findOne({ _id: doctorId, userType: 'Doctor' }).select('availability firstName lastName fee'),
    User.findOne({ _id: patientId, userType: 'Patient' }).select('firstName lastName'),
  ]);

  if (!doctor) {
    throw createRequestError(404, 'Doctor not found');
  }

  if (!patient) {
    throw createRequestError(403, 'Only patients can book appointments');
  }

  const availableSlots = buildSlotsFromAvailability(doctor.availability, appointmentDate, 30);
  if (availableSlots.length === 0) {
    throw createRequestError(400, 'Doctor has not configured any slots for this date');
  }

  if (!availableSlots.includes(slotTime)) {
    throw createRequestError(400, 'Selected slot is not available for this doctor');
  }

  const appointmentAt = toDateTimeFromDateAndLabel(appointmentDate, slotTime);
  if (!appointmentAt) {
    throw createRequestError(400, 'Invalid slotTime format');
  }

  const conflict = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate,
    slotTime,
    status: { $in: BOOKED_STATUSES },
  }).select('_id');

  if (conflict) {
    throw createRequestError(409, 'This slot is already booked');
  }

  return {
    doctor,
    patient,
    appointmentAt,
  };
};

const createSessionForAppointment = async (appointment) => {
  if (appointment.telemedicineSession) {
    const linked = await TelemedicineSession.findById(appointment.telemedicineSession).select('_id status');
    if (linked) {
      if (linked.status !== 'active') {
        linked.status = 'active';
        linked.lastMessageAt = new Date();
        await linked.save();
      }
      return linked._id;
    }
  }

  const existing = await TelemedicineSession.findOne({ appointment: appointment._id }).select('_id status');
  if (existing) {
    if (existing.status !== 'active') {
      existing.status = 'active';
      existing.lastMessageAt = new Date();
      await existing.save();
    }
    appointment.telemedicineSession = existing._id;
    await appointment.save();
    return existing._id;
  }

  const session = await TelemedicineSession.create({
    doctor: appointment.doctor,
    patient: appointment.patient,
    appointment: appointment._id,
    status: 'active',
    lastMessageAt: new Date(),
  });

  appointment.telemedicineSession = session._id;
  await appointment.save();
  return session._id;
};

const closeSessionForAppointment = async (appointment) => {
  const linkedSessionId = appointment.telemedicineSession;

  let session = null;
  if (linkedSessionId) {
    session = await TelemedicineSession.findById(linkedSessionId).select('_id status');
  }

  if (!session) {
    session = await TelemedicineSession.findOne({ appointment: appointment._id }).select('_id status');
  }

  if (!session) {
    appointment.telemedicineSession = undefined;
    return null;
  }

  if (session.status !== 'closed') {
    session.status = 'closed';
    await session.save();
  }

  appointment.telemedicineSession = session._id;
  return session._id;
};

exports.getDoctorSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!validateDateString(date)) {
      return res.status(400).json({ message: 'Query param date must be YYYY-MM-DD' });
    }

    const doctor = await User.findOne({ _id: doctorId, userType: 'Doctor' }).select(
      'firstName lastName availability'
    );

    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const allSlots = buildSlotsFromAvailability(doctor.availability, date, 30);

    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $in: BOOKED_STATUSES },
    }).select('slotTime');

    const booked = new Set(bookedAppointments.map((a) => a.slotTime));
    const availableSlots = allSlots.filter((slot) => !booked.has(slot));

    return res.status(200).json({
      doctor: {
        _id: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`,
      },
      date,
      allSlots,
      availableSlots,
      bookedSlots: [...booked],
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch slots', error: error.message });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const patientId = req.userId;
    const {
      doctorId,
      appointmentDate,
      slotTime,
      reason,
      meetingType,
      appointmentFor,
      relativeName,
      relativeAge,
      relativeRelation,
      relativeImportantThings,
    } = req.body;

    const audienceDetails = parseAppointmentAudience({
      appointmentFor,
      relativeName,
      relativeAge,
      relativeRelation,
      relativeImportantThings,
    });

    const { doctor, patient, appointmentAt } = await getValidatedBookingContext({
      patientId,
      doctorId,
      appointmentDate,
      slotTime,
    });

    const doctorFee = parseDoctorFee(doctor);
    if (doctorFee > 0) {
      return res.status(402).json({
        message: 'Payment required before booking this appointment',
        paymentRequired: true,
        amount: Math.round(doctorFee * 100),
        currency: RAZORPAY_CURRENCY,
      });
    }

    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patientId,
      appointmentDate,
      slotTime,
      appointmentAt,
      status: 'pending',
      reason,
      meetingType: meetingType === 'in-person' ? 'in-person' : 'online',
      ...audienceDetails,
      paymentRequired: false,
      paymentStatus: 'not_required',
    });

    try {
      await notifyDoctorAboutNewAppointment({
        appointment,
        patientProfile: patient,
        patientId,
        reason,
      });
    } catch (notificationError) {
      console.error('Failed to create doctor appointment request notification:', notificationError.message);
    }

    const populated = await Appointment.findById(appointment._id)
      .populate({ path: 'doctor', select: 'firstName lastName specialist fee clinicName' })
      .populate({ path: 'patient', select: 'firstName lastName' });

    return res.status(201).json({
      message: 'Appointment request sent. Awaiting doctor confirmation.',
      appointment: populated,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to book appointment', error: error.message });
  }
};

exports.createAppointmentPaymentOrder = async (req, res) => {
  try {
    const patientId = req.userId;
    const { doctorId, appointmentDate, slotTime } = req.body;
    const razorpay = getRazorpayClient();

    if (!razorpay) {
      return res.status(500).json({ message: 'Payment gateway is not configured on server' });
    }

    const { doctor } = await getValidatedBookingContext({
      patientId,
      doctorId,
      appointmentDate,
      slotTime,
    });

    const doctorFee = parseDoctorFee(doctor);
    if (doctorFee <= 0) {
      return res.status(400).json({ message: 'This doctor does not require online payment' });
    }

    const amount = Math.round(doctorFee * 100);
    const order = await razorpay.orders.create({
      amount,
      currency: RAZORPAY_CURRENCY,
      receipt: `appt_${Date.now()}_${String(patientId).slice(-6)}`,
      notes: {
        doctorId: String(doctorId),
        patientId: String(patientId),
        appointmentDate,
        slotTime,
      },
    });

    return res.status(201).json({
      message: 'Payment order created',
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      doctorFee,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Failed to create payment order', error: error.message });
  }
};

exports.verifyAppointmentPaymentAndBook = async (req, res) => {
  try {
    const patientId = req.userId;
    const {
      doctorId,
      appointmentDate,
      slotTime,
      reason,
      meetingType,
      appointmentFor,
      relativeName,
      relativeAge,
      relativeRelation,
      relativeImportantThings,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    const audienceDetails = parseAppointmentAudience({
      appointmentFor,
      relativeName,
      relativeAge,
      relativeRelation,
      relativeImportantThings,
    });

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: 'razorpayOrderId, razorpayPaymentId, and razorpaySignature are required',
      });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: 'Payment gateway is not configured on server' });
    }

    const { doctor, patient, appointmentAt } = await getValidatedBookingContext({
      patientId,
      doctorId,
      appointmentDate,
      slotTime,
    });

    const doctorFee = parseDoctorFee(doctor);
    if (doctorFee <= 0) {
      return res.status(400).json({ message: 'This doctor does not require online payment' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const providedSignature = String(razorpaySignature);
    const signaturesMatch =
      expectedSignature.length === providedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));

    if (!signaturesMatch) {
      return res.status(400).json({ message: 'Payment signature verification failed' });
    }

    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if (!payment || payment.order_id !== razorpayOrderId) {
      return res.status(400).json({ message: 'Payment details do not match the order' });
    }

    if (!['captured', 'authorized'].includes(payment.status)) {
      return res.status(400).json({ message: 'Payment is not completed yet' });
    }

    const expectedAmount = Math.round(doctorFee * 100);
    if (payment.amount !== expectedAmount) {
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }

    if ((payment.currency || '').toUpperCase() !== RAZORPAY_CURRENCY) {
      return res.status(400).json({ message: 'Payment currency mismatch' });
    }

    const existingPayment = await Appointment.findOne({ paymentId: razorpayPaymentId }).select('_id');
    if (existingPayment) {
      return res.status(409).json({ message: 'This payment has already been used for booking' });
    }

    const appointment = await Appointment.create({
      doctor: doctorId,
      patient: patientId,
      appointmentDate,
      slotTime,
      appointmentAt,
      status: 'pending',
      reason,
      meetingType: meetingType === 'in-person' ? 'in-person' : 'online',
      ...audienceDetails,
      paymentRequired: true,
      paymentStatus: 'paid',
      paymentProvider: 'razorpay',
      paymentOrderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      paymentAmount: payment.amount,
      paymentCurrency: payment.currency,
      paidAt: new Date(),
    });

    try {
      await notifyDoctorAboutNewAppointment({
        appointment,
        patientProfile: patient,
        patientId,
        reason,
      });
    } catch (notificationError) {
      console.error('Failed to create paid appointment request notification for doctor:', notificationError.message);
    }

    const populated = await Appointment.findById(appointment._id)
      .populate({ path: 'doctor', select: 'firstName lastName specialist fee clinicName' })
      .populate({ path: 'patient', select: 'firstName lastName' });

    return res.status(201).json({
      message: 'Payment successful and appointment request sent.',
      appointment: populated,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: 'Failed to verify payment and book appointment', error: error.message });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);
    const filter = { patient: req.userId };

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({ path: 'doctor', select: 'firstName lastName specialist fee clinicName photoUrl' })
        .sort({ appointmentAt: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    return res.status(200).json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};

exports.cancelPatientAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (String(appointment.patient) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!['pending', 'accepted'].includes(appointment.status)) {
      return res.status(400).json({ message: 'Only pending or accepted appointments can be cancelled' });
    }

    appointment.status = 'cancelled';
    await closeSessionForAppointment(appointment);
    await appointment.save();

    const patientProfile = await User.findById(req.userId).select('firstName lastName');
    const patientName = formatPersonName(patientProfile, 'A patient');

    try {
      await createNotification({
        recipientId: appointment.doctor,
        senderId: req.userId,
        type: 'appointment_status',
        title: 'Appointment cancelled',
        message: `${patientName} cancelled the appointment scheduled on ${appointment.appointmentDate} at ${appointment.slotTime}.`,
        meta: {
          appointmentId: appointment._id,
          status: appointment.status,
          appointmentDate: appointment.appointmentDate,
          slotTime: appointment.slotTime,
          meetingType: appointment.meetingType,
          route: '/doctor-dashboard/appointments',
        },
      });
    } catch (notificationError) {
      console.error('Failed to create doctor cancellation notification:', notificationError.message);
    }

    return res.status(200).json({
      message: 'Appointment cancelled successfully',
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);
    const filter = { doctor: req.userId };
    if (status) filter.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({ path: 'patient', select: 'firstName lastName age gender' })
        .sort({ appointmentAt: 1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    return res.status(200).json({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch appointments', error: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, doctorResponseNote } = req.body;

    if (!DOCTOR_STATUS_UPDATES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status update value' });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (String(appointment.doctor) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled appointments cannot be updated' });
    }

    if (appointment.status === 'rejected' && status !== 'rejected') {
      return res.status(400).json({ message: 'Rejected appointments cannot be reopened' });
    }

    if ((appointment.status === 'completed' || appointment.status === 'closed') && status !== appointment.status) {
      return res.status(400).json({ message: 'Terminal appointments cannot be reopened' });
    }

    const previousStatus = appointment.status;
    appointment.status = status;
    if (doctorResponseNote !== undefined) {
      appointment.doctorResponseNote = doctorResponseNote;
    }

    if (status === 'accepted') {
      const sessionId = await createSessionForAppointment(appointment);
      appointment.telemedicineSession = sessionId;
    }

    if (TERMINAL_APPOINTMENT_STATUSES.includes(status)) {
      await closeSessionForAppointment(appointment);
    }

    await appointment.save();

    if (previousStatus !== status) {
      const doctorProfile = await User.findById(req.userId).select('firstName lastName');
      const doctorName =
        `${doctorProfile?.firstName || ''} ${doctorProfile?.lastName || ''}`.trim() || 'Your doctor';
      const statusMessage =
        APPOINTMENT_STATUS_MESSAGES[status] || `updated your appointment status to ${status}`;

      try {
        await createNotification({
          recipientId: appointment.patient,
          senderId: req.userId,
          type: 'appointment_status',
          title: 'Appointment status updated',
          message: `${doctorName} ${statusMessage}. (${appointment.appointmentDate} at ${appointment.slotTime})`,
          meta: {
            appointmentId: appointment._id,
            status,
            appointmentDate: appointment.appointmentDate,
            slotTime: appointment.slotTime,
            meetingType: appointment.meetingType,
          },
        });
      } catch (notificationError) {
        console.error('Failed to create appointment status notification:', notificationError.message);
      }
    }

    const populated = await Appointment.findById(appointment._id)
      .populate({ path: 'patient', select: 'firstName lastName age gender' })
      .populate({ path: 'doctor', select: 'firstName lastName specialist' });

    return res.status(200).json({
      message: `Appointment ${status} successfully`,
      appointment: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update appointment status', error: error.message });
  }
};
