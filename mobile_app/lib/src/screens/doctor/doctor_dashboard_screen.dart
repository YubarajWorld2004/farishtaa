import 'package:flutter/material.dart';

import '../../models/auth_models.dart';
import '../../models/doctor_dashboard_models.dart';
import '../../services/doctor_dashboard_service.dart';

class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({
    super.key,
    required this.session,
    required this.dashboardService,
    required this.onOpenProfile,
    required this.onOpenReviews,
    required this.onOpenAppointments,
    required this.onOpenTelemedicine,
    required this.onOpenPrescriptions,
    required this.onOpenNotifications,
  });

  final UserSession session;
  final DoctorDashboardService dashboardService;
  final VoidCallback onOpenProfile;
  final VoidCallback onOpenReviews;
  final VoidCallback onOpenAppointments;
  final VoidCallback onOpenTelemedicine;
  final VoidCallback onOpenPrescriptions;
  final VoidCallback onOpenNotifications;

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  DoctorDashboardProfile? _profile;
  DoctorDashboardStats _stats = const DoctorDashboardStats(
    totalReviews: 0,
    averageRating: 0,
  );
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait<dynamic>([
        widget.dashboardService.getProfile(token: widget.session.token),
        widget.dashboardService.getStats(token: widget.session.token),
      ]);

      if (!mounted) {
        return;
      }

      setState(() {
        _profile = results[0] as DoctorDashboardProfile;
        _stats = results[1] as DoctorDashboardStats;
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

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) {
      return 'Good Morning';
    }
    if (hour < 17) {
      return 'Good Afternoon';
    }
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final profile = _profile;
    if (profile == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Could not load doctor dashboard.'),
              const SizedBox(height: 10),
              OutlinedButton(onPressed: _bootstrap, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _bootstrap,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Doctor Dashboard',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Notifications',
                onPressed: widget.onOpenNotifications,
                icon: const Icon(Icons.notifications_none),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE3051B), Color(0xFFB20513)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x55B20513),
                  blurRadius: 18,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_greeting()},',
                  style: const TextStyle(color: Color(0xFFFADADD)),
                ),
                const SizedBox(height: 4),
                Text(
                  'Dr. ${profile.fullName}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${profile.specialist.isEmpty ? 'Specialist not set' : profile.specialist} • ${profile.experience > 0 ? '${profile.experience} yrs experience' : 'Experience not set'}',
                  style: const TextStyle(color: Color(0xFFFADADD)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (!profile.profileCompleted)
            Card(
              color: const Color(0xFFFFF6DD),
              child: ListTile(
                leading: const Icon(
                  Icons.error_outline,
                  color: Color(0xFFB45309),
                ),
                title: const Text('Complete your profile'),
                subtitle: const Text(
                  'Add specialization, availability, and clinic details so patients can find and book you.',
                ),
                trailing: OutlinedButton(
                  onPressed: widget.onOpenProfile,
                  child: const Text('Complete'),
                ),
              ),
            )
          else
            const Card(
              color: Color(0xFFE7F9EF),
              child: ListTile(
                leading: Icon(
                  Icons.check_circle_outline,
                  color: Color(0xFF0F9D58),
                ),
                title: Text('Profile complete'),
                subtitle: Text('Your profile is visible to patients.'),
              ),
            ),
          const SizedBox(height: 12),
          GridView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.15,
            ),
            children: [
              _StatCard(
                label: 'Average Rating',
                value: _stats.averageRating > 0
                    ? '${_stats.averageRating.toStringAsFixed(1)} / 5'
                    : 'No ratings',
                color: const Color(0xFFB45309),
              ),
              _StatCard(
                label: 'Total Reviews',
                value: '${_stats.totalReviews}',
                color: const Color(0xFF1D4ED8),
              ),
              _StatCard(
                label: 'Profile',
                value: profile.profileCompleted ? 'Complete' : 'Incomplete',
                color: profile.profileCompleted
                    ? const Color(0xFF0F9D58)
                    : const Color(0xFFB45309),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'Quick Actions',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          _ActionTile(
            icon: Icons.person_outline,
            title: 'Edit Profile',
            subtitle: 'Update specialization, fee, and availability',
            onTap: widget.onOpenProfile,
          ),
          _ActionTile(
            icon: Icons.star_outline,
            title: 'View Reviews',
            subtitle: 'See feedback from your patients',
            onTap: widget.onOpenReviews,
          ),
          _ActionTile(
            icon: Icons.calendar_month_outlined,
            title: 'Manage Appointments',
            subtitle: 'Accept, reject, and complete bookings',
            onTap: widget.onOpenAppointments,
          ),
          _ActionTile(
            icon: Icons.videocam_outlined,
            title: 'Telemedicine',
            subtitle: 'Open active online consultation sessions',
            onTap: widget.onOpenTelemedicine,
          ),
          _ActionTile(
            icon: Icons.receipt_long_outlined,
            title: 'Digital Prescriptions',
            subtitle: 'Create and share treatment plans',
            onTap: widget.onOpenPrescriptions,
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
            const SizedBox(height: 6),
            Text(
              value,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: color, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
