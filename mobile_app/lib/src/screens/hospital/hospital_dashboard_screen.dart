import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../config/app_assets.dart';
import '../../models/auth_models.dart';
import '../../models/hospital_dashboard_models.dart';
import '../../services/hospital_dashboard_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/greeting_utils.dart';

class HospitalDashboardScreen extends StatefulWidget {
  const HospitalDashboardScreen({
    super.key,
    required this.session,
    required this.hospitalService,
    required this.onOpenDoctors,
    required this.onOpenAddDoctor,
    required this.onOpenSettings,
  });

  final UserSession session;
  final HospitalDashboardService hospitalService;
  final VoidCallback onOpenDoctors;
  final VoidCallback onOpenAddDoctor;
  final VoidCallback onOpenSettings;

  @override
  State<HospitalDashboardScreen> createState() =>
      _HospitalDashboardScreenState();
}

class _HospitalDashboardScreenState extends State<HospitalDashboardScreen> {
  HospitalProfileModel? _profile;
  HospitalStatsModel _stats = const HospitalStatsModel(
    totalDoctors: 0,
    completedProfiles: 0,
    totalReviews: 0,
    averageRating: 0,
  );
  bool _loading = true;
  DateTime _currentTime = DateTime.now();
  Timer? _greetingTimer;

  @override
  void initState() {
    super.initState();
    _startGreetingTicker();
    _bootstrap();
  }

  @override
  void dispose() {
    _greetingTimer?.cancel();
    super.dispose();
  }

  void _startGreetingTicker() {
    _greetingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _currentTime = DateTime.now();
      });
    });
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait<dynamic>([
        widget.hospitalService.getProfile(token: widget.session.token),
        widget.hospitalService.getStats(token: widget.session.token),
      ]);

      if (!mounted) {
        return;
      }

      setState(() {
        _profile = results[0] as HospitalProfileModel;
        _stats = results[1] as HospitalStatsModel;
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
              const Text('Could not load hospital dashboard.'),
              const SizedBox(height: 10),
              OutlinedButton(onPressed: _bootstrap, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }

    final isDark = AppTheme.isDark(context);

    return RefreshIndicator(
      onRefresh: _bootstrap,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Image.asset(AppAssets.cross, width: 28, height: 28),
              const SizedBox(width: 10),
              Text(
                'Hospital Dashboard',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
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
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${getTimeBasedGreeting(_currentTime)},',
                        style: const TextStyle(color: Color(0xFFFADADD)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile.displayName,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${_stats.totalDoctors} doctor(s) managed',
                        style: const TextStyle(color: Color(0xFFFADADD)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                SizedBox(
                  width: 84,
                  height: 84,
                  child: SvgPicture.asset(AppAssets.doctorIcon),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (!profile.profileCompleted)
            Card(
              color: isDark ? const Color(0xFF4A3B16) : const Color(0xFFFFF6DD),
              child: ListTile(
                leading: Icon(
                  Icons.error_outline,
                  color: isDark
                      ? const Color(0xFFF5C66A)
                      : const Color(0xFFB45309),
                ),
                title: const Text('Complete your hospital profile'),
                subtitle: const Text(
                  'Add hospital name, address, phone and about details in settings.',
                ),
                trailing: OutlinedButton(
                  onPressed: widget.onOpenSettings,
                  child: const Text('Complete'),
                ),
              ),
            )
          else
            Card(
              color: isDark ? const Color(0xFF123A2A) : const Color(0xFFE7F9EF),
              child: ListTile(
                leading: const Icon(
                  Icons.check_circle_outline,
                  color: Color(0xFF0F9D58),
                ),
                title: const Text('Hospital profile complete'),
                subtitle: const Text('Your hospital profile is ready.'),
              ),
            ),
          const SizedBox(height: 12),
          GridView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.5,
            ),
            children: [
              _StatCard(
                label: 'Total Doctors',
                value: '${_stats.totalDoctors}',
                color: const Color(0xFF1D4ED8),
              ),
              _StatCard(
                label: 'Profiles Complete',
                value: '${_stats.completedProfiles}',
                color: const Color(0xFF0F9D58),
              ),
              _StatCard(
                label: 'Total Reviews',
                value: '${_stats.totalReviews}',
                color: const Color(0xFFB45309),
              ),
              _StatCard(
                label: 'Avg Rating',
                value: _stats.averageRating > 0
                    ? _stats.averageRating.toStringAsFixed(1)
                    : 'N/A',
                color: const Color(0xFFDE1B2C),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _ActionTile(
            icon: Icons.group_outlined,
            title: 'My Doctors',
            subtitle: 'View and manage doctors under your hospital',
            onTap: widget.onOpenDoctors,
          ),
          _ActionTile(
            icon: Icons.person_add_alt_1_outlined,
            title: 'Add Doctor',
            subtitle: 'Register a new doctor account',
            onTap: widget.onOpenAddDoctor,
          ),
          _ActionTile(
            icon: Icons.settings_outlined,
            title: 'Hospital Settings',
            subtitle: 'Update hospital information',
            onTap: widget.onOpenSettings,
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
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: muted)),
            const SizedBox(height: 4),
            Text(
              value,
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
