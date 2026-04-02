const Notification = require('../model/Notification');
const { emitToUser } = require('./socketService');
const { sendFcmPushToUser } = require('./pushNotificationService');

const sanitizeText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const buildNotificationRoute = (type) => {
  if (type === 'telemedicine_message') {
    return '/telemedicine';
  }
  return '/appointments';
};

exports.createPatientNotification = async ({
  patientId,
  senderId = null,
  type = 'system',
  title,
  message,
  meta = {},
}) => {
  if (!patientId || !title || !message) return null;

  const notification = await Notification.create({
    recipient: patientId,
    sender: senderId || undefined,
    type,
    title: sanitizeText(title, 160),
    message: sanitizeText(message, 500),
    meta: meta && typeof meta === 'object' ? meta : {},
  });

  const unreadCount = await Notification.countDocuments({ recipient: patientId, isRead: false });
  const route = buildNotificationRoute(type);

  emitToUser(patientId, 'notification:new', {
    notification,
    unreadCount,
  });

  try {
    await sendFcmPushToUser({
      userId: patientId,
      title: notification.title,
      body: notification.message,
      data: {
        notificationId: notification._id,
        type,
        route,
      },
    });
  } catch (error) {
    console.error('FCM push dispatch failed:', error.message);
  }

  return notification;
};
