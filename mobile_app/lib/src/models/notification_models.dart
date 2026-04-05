DateTime? _toDate(dynamic value) {
  if (value == null) {
    return null;
  }
  return DateTime.tryParse(value.toString());
}

class AppNotificationModel {
  const AppNotificationModel({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    required this.meta,
  });

  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime? createdAt;
  final Map<String, dynamic> meta;

  bool get isTelemedicineNotification => type == 'telemedicine_message';

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: (json['_id'] ?? '').toString(),
      type: (json['type'] ?? 'system').toString(),
      title: (json['title'] ?? 'Notification').toString(),
      message: (json['message'] ?? '').toString(),
      isRead: json['isRead'] == true,
      createdAt: _toDate(json['createdAt']),
      meta: json['meta'] is Map<String, dynamic>
          ? (json['meta'] as Map<String, dynamic>)
          : <String, dynamic>{},
    );
  }
}

class NotificationListResponse {
  const NotificationListResponse({
    required this.notifications,
    required this.unreadCount,
  });

  final List<AppNotificationModel> notifications;
  final int unreadCount;
}

class NotificationMutationResult {
  const NotificationMutationResult({
    required this.unreadCount,
    required this.affectedCount,
  });

  final int unreadCount;
  final int affectedCount;
}
