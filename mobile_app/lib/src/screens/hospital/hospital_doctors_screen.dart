import 'package:flutter/material.dart';

import '../../models/auth_models.dart';
import '../../models/hospital_dashboard_models.dart';
import '../../services/hospital_dashboard_service.dart';
import 'hospital_doctor_detail_screen.dart';

class HospitalDoctorsScreen extends StatefulWidget {
  const HospitalDoctorsScreen({
    super.key,
    required this.session,
    required this.hospitalService,
    required this.onOpenAddDoctor,
  });

  final UserSession session;
  final HospitalDashboardService hospitalService;
  final VoidCallback onOpenAddDoctor;

  @override
  State<HospitalDoctorsScreen> createState() => _HospitalDoctorsScreenState();
}

class _HospitalDoctorsScreenState extends State<HospitalDoctorsScreen> {
  List<HospitalDoctorModel> _doctors = <HospitalDoctorModel>[];
  bool _loading = true;
  String _deletingId = '';

  @override
  void initState() {
    super.initState();
    _fetchDoctors();
  }

  Future<void> _fetchDoctors() async {
    setState(() => _loading = true);
    try {
      final doctors = await widget.hospitalService.getDoctors(
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _doctors = doctors);
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

  Future<void> _removeDoctor(HospitalDoctorModel doctor) async {
    if (_deletingId.isNotEmpty) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Remove Doctor'),
        content: Text('Remove Dr. ${doctor.fullName} from hospital?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      return;
    }

    setState(() => _deletingId = doctor.id);

    try {
      await widget.hospitalService.removeDoctor(
        token: widget.session.token,
        doctorId: doctor.id,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Dr. ${doctor.fullName} removed.')),
      );
      await _fetchDoctors();
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

  Future<void> _openDetail(HospitalDoctorModel doctor) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => HospitalDoctorDetailScreen(
          session: widget.session,
          hospitalService: widget.hospitalService,
          doctorId: doctor.id,
        ),
      ),
    );
    await _fetchDoctors();
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _fetchDoctors,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'My Doctors',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              FilledButton.icon(
                onPressed: widget.onOpenAddDoctor,
                icon: const Icon(Icons.person_add_alt_1_outlined),
                label: const Text('Add'),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${_doctors.length} doctor(s) registered',
            style: const TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_doctors.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text('No doctors yet.'),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: widget.onOpenAddDoctor,
                      child: const Text('Add First Doctor'),
                    ),
                  ],
                ),
              ),
            )
          else
            ..._doctors.map(
              (doctor) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundImage: doctor.photoUrl.isNotEmpty
                            ? NetworkImage(doctor.photoUrl)
                            : null,
                        child: doctor.photoUrl.isEmpty
                            ? Text(
                                doctor.fullName.substring(0, 1).toUpperCase(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
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
                              'Dr. ${doctor.fullName}',
                              style: Theme.of(context).textTheme.titleMedium
                                  ?.copyWith(fontWeight: FontWeight.w800),
                            ),
                            Text(
                              doctor.specialist.isEmpty
                                  ? 'Specialization not set'
                                  : doctor.specialist,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              doctor.experience > 0
                                  ? '${doctor.experience} yrs exp'
                                  : 'Experience not set',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.black54,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Icon(
                                  doctor.profileCompleted
                                      ? Icons.check_circle_outline
                                      : Icons.error_outline,
                                  color: doctor.profileCompleted
                                      ? const Color(0xFF0F9D58)
                                      : const Color(0xFFB45309),
                                  size: 15,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  doctor.profileCompleted
                                      ? 'Profile complete'
                                      : 'Profile incomplete',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: doctor.profileCompleted
                                        ? const Color(0xFF0F9D58)
                                        : const Color(0xFFB45309),
                                  ),
                                ),
                              ],
                            ),
                            if (doctor.reviews.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.star_rounded,
                                    color: Colors.amber,
                                    size: 15,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    doctor.averageRating.toStringAsFixed(1),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '(${doctor.reviews.length})',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Column(
                        children: [
                          IconButton(
                            tooltip: 'View details',
                            onPressed: () => _openDetail(doctor),
                            icon: const Icon(Icons.open_in_new),
                          ),
                          IconButton(
                            tooltip: 'Remove doctor',
                            onPressed: _deletingId == doctor.id
                                ? null
                                : () => _removeDoctor(doctor),
                            icon: _deletingId == doctor.id
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.delete_outline),
                          ),
                        ],
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
