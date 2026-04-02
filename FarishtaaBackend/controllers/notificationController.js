const mongoose = require('mongoose');
const Notification = require('../model/Notification');

const parseLimit = (value, fallback = 20, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const parseBoolean = (value) => String(value || '').toLowerCase() === 'true';

exports.getPatientNotifications = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit, 20, 100);
    const unreadOnly = parseBoolean(req.query.unreadOnly);
    const after = req.query.after ? new Date(req.query.after) : null;

    const filter = { recipient: req.userId };
    if (unreadOnly) {
      filter.isRead = false;
    }

    if (after && !Number.isNaN(after.getTime())) {
      filter.createdAt = { $gt: after };
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });

    return res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

exports.markPatientNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({ message: 'Invalid notification id' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });

    return res.status(200).json({
      message: 'Notification marked as read',
      notification,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
  }
};

exports.markAllPatientNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      message: 'Notifications marked as read',
      updatedCount: result.modifiedCount || 0,
      unreadCount: 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark notifications as read', error: error.message });
  }
};
