import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/auth_models.dart';
import '../../models/hospital_dashboard_models.dart';
import '../../services/hospital_dashboard_service.dart';

class HospitalDoctorDetailScreen extends StatefulWidget {
  const HospitalDoctorDetailScreen({
    super.key,
    required this.session,
    required this.hospitalService,
    required this.doctorId,
  });

  final UserSession session;
  final HospitalDashboardService hospitalService;
  final String doctorId;

  @override
  State<HospitalDoctorDetailScreen> createState() =>
      _HospitalDoctorDetailScreenState();
}

class _HospitalDoctorDetailScreenState
    extends State<HospitalDoctorDetailScreen> {
  HospitalDoctorModel? _doctor;
  List<HospitalDoctorReview> _reviews = <HospitalDoctorReview>[];
  bool _loading = true;
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait<dynamic>([
        widget.hospitalService.getDoctorDetail(
          token: widget.session.token,
          doctorId: widget.doctorId,
        ),
        widget.hospitalService.getDoctorReviews(
          token: widget.session.token,
          doctorId: widget.doctorId,
        ),
      ]);

      if (!mounted) {
        return;
      }

      setState(() {
        _doctor = results[0] as HospitalDoctorModel;
        _reviews = results[1] as List<HospitalDoctorReview>;
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
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final doctor = _doctor;
    if (doctor == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Doctor Detail')),
        body: const Center(child: Text('Doctor not found.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Doctor Detail')),
      body: RefreshIndicator(
        onRefresh: _bootstrap,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: doctor.photoUrl.isNotEmpty
                      ? NetworkImage(doctor.photoUrl)
                      : null,
                  child: doctor.photoUrl.isEmpty
                      ? Text(
                          doctor.fullName.substring(0, 1).toUpperCase(),
                          style: const TextStyle(fontWeight: FontWeight.w700),
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
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        doctor.specialist.isEmpty
                            ? 'Specialization not set'
                            : doctor.specialist,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        doctor.profileCompleted
                            ? 'Profile complete'
                            : 'Profile incomplete',
                        style: TextStyle(
                          color: doctor.profileCompleted
                              ? const Color(0xFF0F9D58)
                              : const Color(0xFFB45309),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, label: Text('Details')),
                ButtonSegment(value: 1, label: Text('Reviews')),
              ],
              selected: {_tabIndex},
              onSelectionChanged: (value) {
                setState(() => _tabIndex = value.first);
              },
            ),
            const SizedBox(height: 12),
            if (_tabIndex == 0) ...[
              _DetailRow(label: 'Email', value: doctor.email),
              _DetailRow(
                label: 'Experience',
                value: doctor.experience > 0
                    ? '${doctor.experience} years'
                    : 'Not set',
              ),
              _DetailRow(
                label: 'Degree',
                value: doctor.degree.isEmpty ? 'Not set' : doctor.degree,
              ),
              _DetailRow(
                label: 'Languages',
                value: doctor.languages.isEmpty
                    ? 'Not set'
                    : doctor.languages.join(', '),
              ),
              _DetailRow(
                label: 'Address',
                value: doctor.address.isEmpty ? 'Not set' : doctor.address,
              ),
              if (doctor.about.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'About',
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 6),
                        Text(doctor.about),
                      ],
                    ),
                  ),
                ),
              if (doctor.availability.isNotEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Availability',
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        const SizedBox(height: 8),
                        ...doctor.availability.map(
                          (slot) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                Expanded(child: Text(slot.day)),
                                Text('${slot.startTime} - ${slot.endTime}'),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ] else ...[
              if (_reviews.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(14),
                    child: Text('No reviews yet.'),
                  ),
                )
              else
                ..._reviews.map(
                  (review) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  review.patientName,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              const Icon(
                                Icons.star_rounded,
                                color: Colors.amber,
                              ),
                              Text(review.rating.toStringAsFixed(1)),
                            ],
                          ),
                          if (review.review.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(review.review),
                          ],
                          if (review.createdAt != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              DateFormat(
                                'dd MMM yyyy',
                              ).format(review.createdAt!),
                              style: const TextStyle(
                                color: Colors.black54,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 110,
              child: Text(label, style: const TextStyle(color: Colors.black54)),
            ),
            Expanded(
              child: Text(
                value,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
