import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_config.dart';
import '../../config/app_assets.dart';
import '../../models/auth_models.dart';
import '../../models/doctor.dart';
import '../../services/doctor_service.dart';
import '../../services/location_service.dart';
import '../../services/patient_service.dart';
import '../../theme/app_theme.dart';
import '../../utils/greeting_utils.dart';
import 'doctor_profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    required this.session,
    required this.doctorService,
    required this.patientService,
    required this.onOpenChat,
    required this.onOpenAppointments,
    required this.onOpenNotifications,
  });

  final UserSession session;
  final DoctorService doctorService;
  final PatientService patientService;
  final VoidCallback onOpenChat;
  final VoidCallback onOpenAppointments;
  final VoidCallback onOpenNotifications;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _locationService = LocationService();

  List<String> _categories = <String>[];
  List<DoctorListItem> _doctors = <DoctorListItem>[];
  bool _loading = true;
  String _selectedCategory = 'Cardiologist';
  late double _userLat = AppConfig.defaultLat;
  late double _userLng = AppConfig.defaultLng;
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
      try {
        final location = await _locationService.getCurrentLocation();
        _userLat = location.lat;
        _userLng = location.lng;
      } catch (_) {
        _userLat = AppConfig.defaultLat;
        _userLng = AppConfig.defaultLng;
      }

      final categories = await widget.doctorService.getCategories();
      final selected = categories.isNotEmpty
          ? categories.first
          : _selectedCategory;
      final doctors = await widget.doctorService.searchNearbyByCategory(
        category: selected,
        lat: _userLat,
        lng: _userLng,
      );

      if (!mounted) {
        return;
      }
      setState(() {
        _categories = categories;
        _selectedCategory = selected;
        _doctors = doctors;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not load doctors right now')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _loadByCategory(String category) async {
    setState(() {
      _selectedCategory = category;
      _loading = true;
    });

    try {
      final doctors = await widget.doctorService.searchNearbyByCategory(
        category: category,
        lat: _userLat,
        lng: _userLng,
      );
      if (!mounted) {
        return;
      }
      setState(() => _doctors = doctors);
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not refresh doctors')),
      );
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayName = widget.session.firstName.isEmpty
        ? 'User'
        : widget.session.firstName;

    return RefreshIndicator(
      onRefresh: _bootstrap,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${getTimeBasedGreeting(_currentTime)}, $displayName',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
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
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Feel Unwell?',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Ask Farishtaa AI for instant symptom guidance and find specialists nearby.',
                        style: TextStyle(color: Colors.white, height: 1.4),
                      ),
                      const SizedBox(height: 10),
                      const Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _HeroPill(
                            assetPath: AppAssets.brain,
                            label: 'AI Guidance',
                          ),
                          _HeroPill(
                            assetPath: AppAssets.doctorIcon,
                            label: 'Doctor Finder',
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      FilledButton.tonal(
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppTheme.dangerRed,
                        ),
                        onPressed: widget.onOpenChat,
                        child: const Text('Chat Now'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Colors.white70),
                        ),
                        onPressed: widget.onOpenAppointments,
                        child: const Text('My Appointments'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                SizedBox(
                  width: 92,
                  height: 92,
                  child: SvgPicture.asset(AppAssets.chat, fit: BoxFit.contain),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'Specialties',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 42,
            child: _categories.isEmpty
                ? const Center(child: Text('No specialties found'))
                : ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemBuilder: (_, index) {
                      final category = _categories[index];
                      final selected = category == _selectedCategory;
                      return ChoiceChip(
                        selected: selected,
                        label: Text(category),
                        onSelected: (_) => _loadByCategory(category),
                      );
                    },
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemCount: _categories.length,
                  ),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Text(
                '${_doctors.length} doctors available nearby',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const Spacer(),
              if (_loading)
                const SizedBox(
                  height: 18,
                  width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2.3),
                ),
            ],
          ),
          const SizedBox(height: 10),
          if (!_loading && _doctors.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'No doctors match this specialty in current range.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ),
          ..._doctors.map(
            (doctor) => _DoctorCard(
              doctor: doctor,
              session: widget.session,
              doctorService: widget.doctorService,
              patientService: widget.patientService,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroPill extends StatelessWidget {
  const _HeroPill({required this.assetPath, required this.label});

  final String assetPath;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(width: 16, height: 16, child: SvgPicture.asset(assetPath)),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  const _DoctorCard({
    required this.doctor,
    required this.session,
    required this.doctorService,
    required this.patientService,
  });

  final DoctorListItem doctor;
  final UserSession session;
  final DoctorService doctorService;
  final PatientService patientService;

  Future<void> _openDirections(BuildContext context) async {
    final lat = doctor.latitude;
    final lng = doctor.longitude;
    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Directions are unavailable for this doctor'),
        ),
      );
      return;
    }

    final uri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
    );
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open maps application')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final muted = Theme.of(context).colorScheme.onSurfaceVariant;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: AppTheme.isDark(context)
                      ? const Color(0xFF243849)
                      : const Color(0xFFD1F0EF),
                  backgroundImage: doctor.photoUrl.isNotEmpty
                      ? NetworkImage(doctor.photoUrl)
                      : null,
                  child: doctor.photoUrl.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(8),
                          child: SvgPicture.asset(
                            AppAssets.doctorIcon,
                            fit: BoxFit.contain,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        doctor.name,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      Text(
                        doctor.speciality,
                        style: TextStyle(
                          color: AppTheme.dangerRed,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${doctor.experience} years experience'
                        '${doctor.distanceKm == null ? '' : ' | ${doctor.distanceKm!.toStringAsFixed(1)} km away'}',
                        style: TextStyle(color: muted),
                      ),
                    ],
                  ),
                ),
                if (doctor.isNearby)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.healingGreen,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'NEARBY',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(
                  Icons.star_rounded,
                  color: Color(0xFF0F9D58),
                  size: 18,
                ),
                const SizedBox(width: 4),
                Text(
                  doctor.rating == 0 ? 'New' : doctor.rating.toStringAsFixed(1),
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(width: 8),
                Text('(${doctor.reviewCount} reviews)'),
                const Spacer(),
                ...doctor.tags.map(
                  (tag) => Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: Chip(
                      label: Text(tag),
                      visualDensity: VisualDensity.compact,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _openDirections(context),
                    child: const Text('Directions'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => DoctorProfileScreen(
                            initialDoctor: doctor,
                            session: session,
                            doctorService: doctorService,
                            patientService: patientService,
                          ),
                        ),
                      );
                    },
                    child: const Text('View Profile'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
