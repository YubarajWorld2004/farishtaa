import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/auth_models.dart';
import '../../models/notification_models.dart';
import '../../services/doctor_dashboard_service.dart';

class DoctorNotificationsScreen extends StatefulWidget {
  const DoctorNotificationsScreen({
    super.key,
    required this.session,
    required this.dashboardService,
    required this.onOpenAppointments,
    required this.onOpenTelemedicine,
  });

  final UserSession session;
  final DoctorDashboardService dashboardService;
  final VoidCallback onOpenAppointments;
  final ValueChanged<String?> onOpenTelemedicine;

  @override
  State<DoctorNotificationsScreen> createState() =>
      _DoctorNotificationsScreenState();
}

class _DoctorNotificationsScreenState extends State<DoctorNotificationsScreen> {
  List<AppNotificationModel> _notifications = <AppNotificationModel>[];
  int _unreadCount = 0;
  bool _loading = true;
  bool _updating = false;
  bool _unreadOnly = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final response = await widget.dashboardService.getNotifications(
        token: widget.session.token,
        unreadOnly: _unreadOnly,
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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _markAllRead() async {
    if (_updating) {
      return;
    }

    setState(() => _updating = true);
    try {
      await widget.dashboardService.markAllNotificationsRead(
        token: widget.session.token,
      );
      await _fetch();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }

  Future<void> _markRead(AppNotificationModel item) async {
    if (_updating || item.isRead) {
      return;
    }

    setState(() => _updating = true);
    try {
      await widget.dashboardService.markNotificationRead(
        token: widget.session.token,
        notificationId: item.id,
      );
      await _fetch();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }

  void _openRelated(AppNotificationModel item) {
    final route = (item.meta['route'] ?? '').toString();
    final sessionId = (item.meta['sessionId'] ?? '').toString();

    if (route.contains('telemedicine') || sessionId.isNotEmpty) {
      widget.onOpenTelemedicine(sessionId.isEmpty ? null : sessionId);
      return;
    }

    widget.onOpenAppointments();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.session.userType.toLowerCase() != 'doctor') {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text(
            'Notifications are currently available for Doctor accounts.',
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
                Chip(
                  label: Text('Unread: $_unreadCount'),
                  backgroundColor: const Color(0xFFFEF2F2),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              FilterChip(
                label: const Text('Unread only'),
                selected: _unreadOnly,
                onSelected: (selected) {
                  setState(() => _unreadOnly = selected);
                  _fetch();
                },
              ),
              OutlinedButton.icon(
                onPressed: (_updating || _loading || _unreadCount == 0)
                    ? null
                    : _markAllRead,
                icon: const Icon(Icons.done_all),
                label: const Text('Mark all read'),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 20),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_notifications.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No notifications found.'),
              ),
            )
          else
            ..._notifications.map((item) {
              final createdText = item.createdAt == null
                  ? 'Unknown time'
                  : DateFormat('dd MMM, h:mm a').format(item.createdAt!);
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              item.title,
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                          ),
                          Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: item.isRead
                                  ? Colors.grey.shade400
                                  : const Color(0xFFDE1B2C),
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(item.message),
                      const SizedBox(height: 6),
                      Text(
                        createdText,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => _openRelated(item),
                            icon: const Icon(Icons.open_in_new),
                            label: const Text('Open Related'),
                          ),
                          if (!item.isRead)
                            OutlinedButton.icon(
                              onPressed: _updating
                                  ? null
                                  : () => _markRead(item),
                              icon: const Icon(Icons.mark_email_read_outlined),
                              label: const Text('Mark read'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
