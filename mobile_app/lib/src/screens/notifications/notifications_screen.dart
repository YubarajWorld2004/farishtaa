import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/auth_models.dart';
import '../../models/notification_models.dart';
import '../../services/patient_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({
    super.key,
    required this.session,
    required this.patientService,
    this.onNavigateFromNotification,
  });

  final UserSession session;
  final PatientService patientService;
  final void Function(String route)? onNavigateFromNotification;

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  static const _pollEvery = Duration(seconds: 6);

  List<AppNotificationModel> _notifications = <AppNotificationModel>[];
  int _unreadCount = 0;
  bool _loading = true;
  bool _markingAll = false;
  bool _deletingAll = false;
  String _deletingId = '';

  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    if (_canUsePatientNotifications) {
      _fetch();
      _pollTimer = Timer.periodic(_pollEvery, (_) => _fetch(silent: true));
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  bool get _canUsePatientNotifications =>
      widget.session.userType.toLowerCase() == 'patient';

  Future<void> _fetch({bool silent = false}) async {
    if (!silent) {
      setState(() => _loading = true);
    }

    try {
      final response = await widget.patientService.getNotifications(
        token: widget.session.token,
        limit: 20,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _notifications = response.notifications;
        _unreadCount = response.unreadCount;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      if (!silent) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted && !silent) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _markAllRead() async {
    if (_markingAll || _deletingAll || _deletingId.isNotEmpty) {
      return;
    }

    setState(() => _markingAll = true);
    try {
      await widget.patientService.markAllNotificationsRead(
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _unreadCount = 0;
        _notifications = _notifications
            .map(
              (item) => AppNotificationModel(
                id: item.id,
                type: item.type,
                title: item.title,
                message: item.message,
                isRead: true,
                createdAt: item.createdAt,
                meta: item.meta,
              ),
            )
            .toList();
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _markingAll = false);
      }
    }
  }

  Future<void> _deleteNotification(AppNotificationModel notification) async {
    if (_markingAll || _deletingAll || _deletingId.isNotEmpty) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete notification?'),
        content: const Text('This notification will be removed permanently.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    setState(() => _deletingId = notification.id);
    try {
      final result = await widget.patientService.deleteNotification(
        token: widget.session.token,
        notificationId: notification.id,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _notifications = _notifications
            .where((item) => item.id != notification.id)
            .toList();
        _unreadCount = result.unreadCount;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _deletingId = '');
      }
    }
  }

  Future<void> _deleteAllNotifications() async {
    if (_markingAll || _deletingAll || _deletingId.isNotEmpty) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete all notifications?'),
        content: const Text('All notifications will be removed permanently.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete all'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    setState(() => _deletingAll = true);
    try {
      final result = await widget.patientService.deleteAllNotifications(
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _notifications = <AppNotificationModel>[];
        _unreadCount = result.unreadCount;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _deletingAll = false);
      }
    }
  }

  Future<void> _openNotification(AppNotificationModel notification) async {
    if (!notification.isRead) {
      try {
        final response = await widget.patientService.markNotificationRead(
          token: widget.session.token,
          notificationId: notification.id,
        );
        if (!mounted) {
          return;
        }
        setState(() {
          _unreadCount = response.unreadCount;
          _notifications = _notifications
              .map(
                (item) => item.id == notification.id
                    ? AppNotificationModel(
                        id: item.id,
                        type: item.type,
                        title: item.title,
                        message: item.message,
                        isRead: true,
                        createdAt: item.createdAt,
                        meta: item.meta,
                      )
                    : item,
              )
              .toList();
        });
      } catch (_) {
        // Non-blocking: keep navigation behavior even if mark-read fails.
      }
    }

    final route = notification.isTelemedicineNotification
        ? 'telemedicine'
        : 'appointments';
    widget.onNavigateFromNotification?.call(route);
  }

  String _relative(DateTime? time) {
    if (time == null) {
      return 'Just now';
    }

    final diff = DateTime.now().difference(time);
    if (diff.inSeconds < 60) {
      return '${diff.inSeconds}s ago';
    }
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    }
    if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    }
    return DateFormat('dd MMM').format(time);
  }

  @override
  Widget build(BuildContext context) {
    if (!_canUsePatientNotifications) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'Notifications are currently available for Patient accounts only.',
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetch,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Notifications',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              if (_unreadCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F1FF),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$_unreadCount unread',
                    style: const TextStyle(
                      color: Color(0xFF1D4ED8),
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton(
                onPressed:
                    (_markingAll ||
                        _deletingAll ||
                        _deletingId.isNotEmpty ||
                        _unreadCount == 0)
                    ? null
                    : _markAllRead,
                child: _markingAll
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Mark all read'),
              ),
              OutlinedButton(
                onPressed:
                    (_markingAll ||
                        _deletingAll ||
                        _deletingId.isNotEmpty ||
                        _notifications.isEmpty)
                    ? null
                    : _deleteAllNotifications,
                child: _deletingAll
                    ? const SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Delete all'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_notifications.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No notifications yet.'),
              ),
            )
          else
            ..._notifications.map(
              (item) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  onTap: () => _openNotification(item),
                  leading: Icon(
                    item.isTelemedicineNotification
                        ? Icons.videocam_outlined
                        : Icons.calendar_month_outlined,
                  ),
                  title: Text(
                    item.title,
                    style: TextStyle(
                      fontWeight: item.isRead
                          ? FontWeight.w600
                          : FontWeight.w800,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(item.message),
                      const SizedBox(height: 4),
                      Text(
                        _relative(item.createdAt),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ],
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (!item.isRead)
                        const Icon(Icons.circle, size: 10, color: Colors.red),
                      IconButton(
                        tooltip: 'Delete notification',
                        onPressed:
                            (_markingAll ||
                                _deletingAll ||
                                _deletingId.isNotEmpty)
                            ? null
                            : () => _deleteNotification(item),
                        icon: _deletingId == item.id
                            ? const SizedBox(
                                width: 14,
                                height: 14,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
