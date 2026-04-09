const Notification = require('../model/Notification');
const { emitToUser } = require('./socketService');
const { sendFcmPushToUser } = require('./pushNotificationService');

const sanitizeText = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const buildNotificationRoute = (type, meta = {}) => {
  if (meta && typeof meta.route === 'string' && meta.route.trim()) {
    return meta.route.trim();
  }

  if (type === 'telemedicine_message') {
    return '/telemedicine';
  }
  return '/appointments';
};

exports.createNotification = async ({
  recipientId,
  senderId = null,
  type = 'system',
  title,
  message,
  meta = {},
}) => {
  if (!recipientId || !title || !message) return null;

  const safeMeta = meta && typeof meta === 'object' ? meta : {};

  const notification = await Notification.create({
    recipient: recipientId,
    sender: senderId || undefined,
    type,
    title: sanitizeText(title, 160),
    message: sanitizeText(message, 500),
    meta: safeMeta,
  });

  const unreadCount = await Notification.countDocuments({ recipient: recipientId, isRead: false });
  const route = buildNotificationRoute(type, safeMeta);

  emitToUser(recipientId, 'notification:new', {
    notification,
    unreadCount,
  });

  sendFcmPushToUser({
    userId: recipientId,
    title: notification.title,
    body: notification.message,
    data: {
      notificationId: String(notification._id),
      type: String(type),
      route,
    },
  }).catch((error) => {
    console.error('FCM push dispatch failed:', error.message);
  });

  return notification;
};

exports.createPatientNotification = async ({ patientId, ...rest }) =>
  exports.createNotification({
    recipientId: patientId,
    ...rest,
  });
