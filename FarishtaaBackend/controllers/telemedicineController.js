const TelemedicineSession = require('../model/TelemedicineSession');
const TelemedicineMessage = require('../model/TelemedicineMessage');
const Appointment = require('../model/Appointment');
const { toPublicUploadUrl } = require('../middleware/upload');
const { createNotification } = require('../service/notificationService');

const mapFilesToAttachments = (files = []) =>
  files.map((file) => ({
    fileName: file.originalname,
    fileUrl: toPublicUploadUrl(file.path),
    mimeType: file.mimetype,
    size: file.size,
  }));

const PATIENT_BLOCKED_APPOINTMENT_STATUSES = ['rejected', 'completed', 'cancelled', 'closed'];

const formatPersonName = (profile, fallback) =>
  `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || fallback;

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

const ensureSessionAccess = async (sessionId, userId, userType) => {
  const session = await TelemedicineSession.findById(sessionId).populate({
    path: 'appointment',
    select: 'status',
  });
  if (!session) return { error: 'Session not found', status: 404 };

  const isDoctor = userType === 'Doctor' && String(session.doctor) === String(userId);
  const isPatient = userType === 'Patient' && String(session.patient) === String(userId);

  if (!isDoctor && !isPatient) {
    return { error: 'Forbidden', status: 403 };
  }

  if (isPatient) {
    const appointmentStatus = session.appointment?.status;
    if (session.status === 'closed' || PATIENT_BLOCKED_APPOINTMENT_STATUSES.includes(appointmentStatus)) {
      return { error: 'Telemedicine chat is unavailable for this appointment', status: 403 };
    }
  }

  return { session };
};

exports.getPatientTelemedicineSessions = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);
    const filter = { patient: req.userId };

    const [sessions, total] = await Promise.all([
      TelemedicineSession.find(filter)
        .populate({ path: 'doctor', select: 'firstName lastName specialist photoUrl clinicName' })
        .populate({ path: 'appointment', select: 'appointmentDate slotTime status' })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      TelemedicineSession.countDocuments(filter),
    ]);

    const filtered = sessions.filter((session) => {
      const appointmentStatus = session.appointment?.status;
      if (session.status === 'closed') return false;
      if (PATIENT_BLOCKED_APPOINTMENT_STATUSES.includes(appointmentStatus)) return false;
      return true;
    });

    return res.status(200).json({
      sessions: filtered,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

exports.getDoctorTelemedicineSessions = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20, 100);
    const filter = { doctor: req.userId };

    const [sessions, total] = await Promise.all([
      TelemedicineSession.find(filter)
        .populate({ path: 'patient', select: 'firstName lastName age gender' })
        .populate({ path: 'appointment', select: 'appointmentDate slotTime status' })
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      TelemedicineSession.countDocuments(filter),
    ]);

    return res.status(200).json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch sessions', error: error.message });
  }
};

exports.getPatientTelemedicineMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 50, 200);
    const access = await ensureSessionAccess(sessionId, req.userId, 'Patient');

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const filter = { session: sessionId };
    const [messages, total] = await Promise.all([
      TelemedicineMessage.find(filter)
        .populate({ path: 'sender', select: 'firstName lastName userType' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TelemedicineMessage.countDocuments(filter),
    ]);

    return res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

exports.getDoctorTelemedicineMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 50, 200);
    const access = await ensureSessionAccess(sessionId, req.userId, 'Doctor');

    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const filter = { session: sessionId };
    const [messages, total] = await Promise.all([
      TelemedicineMessage.find(filter)
        .populate({ path: 'sender', select: 'firstName lastName userType' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      TelemedicineMessage.countDocuments(filter),
    ]);

    return res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

exports.sendPatientTelemedicineMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content = '' } = req.body;

    const access = await ensureSessionAccess(sessionId, req.userId, 'Patient');
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const attachments = mapFilesToAttachments(req.files || []);
    if (!content.trim() && attachments.length === 0) {
      return res.status(400).json({ message: 'Message content or at least one attachment is required' });
    }

    const message = await TelemedicineMessage.create({
      session: sessionId,
      sender: req.userId,
      senderType: 'Patient',
      content: content.trim(),
      attachments,
    });

    await TelemedicineSession.findByIdAndUpdate(sessionId, {
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    });

    const populated = await TelemedicineMessage.findById(message._id).populate({
      path: 'sender',
      select: 'firstName lastName userType',
    });

    const senderName = formatPersonName(populated?.sender, 'Patient');
    const trimmedContent = content.trim();
    const preview = trimmedContent
      ? trimmedContent.length > 120
        ? `${trimmedContent.slice(0, 117)}...`
        : trimmedContent
      : 'sent an attachment in telemedicine chat';

    try {
      await createNotification({
        recipientId: access.session.doctor,
        senderId: req.userId,
        type: 'telemedicine_message',
        title: 'New patient telemedicine message',
        message: `${senderName}: ${preview}`,
        meta: {
          sessionId,
          appointmentId: access.session?.appointment?._id || access.session?.appointment,
          messageId: message._id,
          route: '/telemedicine',
        },
      });
    } catch (notificationError) {
      console.error('Failed to create doctor telemedicine notification:', notificationError.message);
    }

    return res.status(201).json({ message: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.sendDoctorTelemedicineMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content = '' } = req.body;

    const access = await ensureSessionAccess(sessionId, req.userId, 'Doctor');
    if (access.error) {
      return res.status(access.status).json({ message: access.error });
    }

    const attachments = mapFilesToAttachments(req.files || []);
    if (!content.trim() && attachments.length === 0) {
      return res.status(400).json({ message: 'Message content or at least one attachment is required' });
    }

    const message = await TelemedicineMessage.create({
      session: sessionId,
      sender: req.userId,
      senderType: 'Doctor',
      content: content.trim(),
      attachments,
    });

    await TelemedicineSession.findByIdAndUpdate(sessionId, {
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    });

    const populated = await TelemedicineMessage.findById(message._id).populate({
      path: 'sender',
      select: 'firstName lastName userType',
    });

    const senderName =
      `${populated?.sender?.firstName || ''} ${populated?.sender?.lastName || ''}`.trim() ||
      'Your doctor';
    const trimmedContent = content.trim();
    const preview = trimmedContent
      ? trimmedContent.length > 120
        ? `${trimmedContent.slice(0, 117)}...`
        : trimmedContent
      : 'sent you an attachment in telemedicine chat';

    try {
      await createNotification({
        recipientId: access.session.patient,
        senderId: req.userId,
        type: 'telemedicine_message',
        title: 'New telemedicine message',
        message: `${senderName}: ${preview}`,
        meta: {
          sessionId,
          appointmentId: access.session?.appointment?._id || access.session?.appointment,
          messageId: message._id,
          route: '/telemedicine',
        },
      });
    } catch (notificationError) {
      console.error('Failed to create telemedicine notification:', notificationError.message);
    }

    return res.status(201).json({ message: populated });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

exports.createSessionForAppointmentIfNeeded = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return null;
  if (appointment.telemedicineSession) return appointment.telemedicineSession;

  const existing = await TelemedicineSession.findOne({ appointment: appointment._id }).select('_id');
  if (existing) {
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
