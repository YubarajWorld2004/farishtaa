import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/auth_models.dart';
import '../../models/doctor.dart';
import '../../services/doctor_service.dart';
import '../../services/patient_service.dart';
import '../../theme/app_theme.dart';
import '../appointments/book_appointment_screen.dart';

class DoctorProfileScreen extends StatefulWidget {
  const DoctorProfileScreen({
    super.key,
    required this.initialDoctor,
    required this.session,
    required this.doctorService,
    required this.patientService,
  });

  final DoctorListItem initialDoctor;
  final UserSession session;
  final DoctorService doctorService;
  final PatientService patientService;

  @override
  State<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends State<DoctorProfileScreen> {
  final _reviewController = TextEditingController();

  late DoctorListItem _doctor = widget.initialDoctor;
  bool _loading = true;
  bool _submittingReview = false;
  int _rating = 5;

  bool get _isPatient => widget.session.userType.toLowerCase() == 'patient';

  @override
  void initState() {
    super.initState();
    _loadDoctor();
  }

  @override
  void dispose() {
    _reviewController.dispose();
    super.dispose();
  }

  Future<void> _loadDoctor() async {
    setState(() => _loading = true);
    try {
      final latest = await widget.doctorService.getDoctorById(
        doctorId: _doctor.id,
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _doctor = latest);
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

  Future<void> _openDirections() async {
    final mapLink = _doctor.mapLink;
    Uri uri;

    if (mapLink.isNotEmpty) {
      uri = Uri.parse(mapLink);
    } else {
      final lat = _doctor.latitude;
      final lng = _doctor.longitude;
      if (lat == null || lng == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Directions are unavailable for this doctor'),
          ),
        );
        return;
      }
      uri = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng',
      );
    }

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not open maps app')));
    }
  }

  Future<void> _submitReview() async {
    final review = _reviewController.text.trim();
    if (review.isEmpty || _submittingReview) {
      return;
    }

    setState(() => _submittingReview = true);
    try {
      await widget.doctorService.addReview(
        token: widget.session.token,
        doctorId: _doctor.id,
        patientId: widget.session.userId,
        rating: _rating,
        review: review,
      );

      _reviewController.clear();
      setState(() => _rating = 5);
      await _loadDoctor();

      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Review submitted successfully.')),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _submittingReview = false);
      }
    }
  }

  Future<void> _openBooking() async {
    final booked = await Navigator.of(context).push<bool>(
      MaterialPageRoute<bool>(
        builder: (_) => BookAppointmentScreen(
          session: widget.session,
          doctorService: widget.doctorService,
          patientService: widget.patientService,
          doctorId: _doctor.id,
        ),
      ),
    );

    if (booked == true) {
      await _loadDoctor();
    }
  }

  @override
  Widget build(BuildContext context) {
    final doctor = _doctor;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Doctor Profile'),
        actions: [
          IconButton(onPressed: _loadDoctor, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    CircleAvatar(
                      radius: 34,
                      backgroundColor: const Color(0xFFD1F0EF),
                      backgroundImage: doctor.photoUrl.isNotEmpty
                          ? NetworkImage(doctor.photoUrl)
                          : null,
                      child: doctor.photoUrl.isEmpty
                          ? Text(
                              doctor.name.isEmpty
                                  ? 'D'
                                  : doctor.name[0].toUpperCase(),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 24,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            doctor.name,
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            doctor.speciality,
                            style: const TextStyle(
                              color: AppTheme.dangerRed,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (doctor.clinicName.isNotEmpty)
                            Text(
                              doctor.clinicName,
                              style: const TextStyle(color: Colors.black54),
                            ),
                          const SizedBox(height: 6),
                          Text(
                            '${doctor.experience} years experience',
                            style: const TextStyle(color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Overview',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(
                              Icons.star_rounded,
                              color: Color(0xFF0F9D58),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              doctor.rating == 0
                                  ? 'New'
                                  : doctor.rating.toStringAsFixed(1),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text('(${doctor.reviews.length} reviews)'),
                          ],
                        ),
                        if (doctor.fee > 0) ...[
                          const SizedBox(height: 6),
                          Text(
                            'Consultation fee: Rs ${doctor.fee.toStringAsFixed(doctor.fee == doctor.fee.roundToDouble() ? 0 : 2)}',
                            style: const TextStyle(
                              color: Color(0xFF0F9D58),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                        if (doctor.distanceKm != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            '${doctor.distanceKm!.toStringAsFixed(1)} km away',
                            style: const TextStyle(color: Colors.black54),
                          ),
                        ],
                        if (doctor.address.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(doctor.address),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                if (doctor.availability.isNotEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Availability',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 8),
                          ...doctor.availability.map(
                            (slot) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                children: [
                                  Expanded(child: Text(slot.day)),
                                  Text(
                                    '${slot.startTime} - ${slot.endTime}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'About',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          doctor.about.isEmpty
                              ? 'No description available yet.'
                              : doctor.about,
                          style: const TextStyle(height: 1.4),
                        ),
                        if (doctor.languages.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: doctor.languages
                                .map((lang) => Chip(label: Text(lang)))
                                .toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                if (_isPatient)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Write a Review',
                            style: TextStyle(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            children: List.generate(
                              5,
                              (index) => IconButton(
                                onPressed: _submittingReview
                                    ? null
                                    : () => setState(() => _rating = index + 1),
                                icon: Icon(
                                  Icons.star_rounded,
                                  color: index < _rating
                                      ? Colors.amber
                                      : Colors.grey.shade300,
                                ),
                              ),
                            ),
                          ),
                          TextField(
                            controller: _reviewController,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              hintText: 'Share your consultation experience',
                            ),
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: _submittingReview ? null : _submitReview,
                            child: _submittingReview
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Text('Submit Review'),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Patient Reviews',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 8),
                        if (doctor.reviews.isEmpty)
                          const Text('No reviews yet.')
                        else
                          ...doctor.reviews.map(
                            (item) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.patientName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      Text(
                                        item.rating.toStringAsFixed(1),
                                        style: const TextStyle(
                                          color: Colors.amber,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      const Icon(
                                        Icons.star_rounded,
                                        color: Colors.amber,
                                        size: 16,
                                      ),
                                    ],
                                  ),
                                  if (item.review.isNotEmpty)
                                    Text(
                                      item.review,
                                      style: const TextStyle(height: 1.35),
                                    ),
                                  if (item.createdAt != null)
                                    Text(
                                      DateFormat(
                                        'dd MMM yyyy',
                                      ).format(item.createdAt!),
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.black54,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _openDirections,
                  icon: const Icon(Icons.directions),
                  label: const Text('Directions'),
                ),
              ),
              const SizedBox(width: 10),
              if (_isPatient)
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: doctor.supportsOnlineBooking
                        ? _openBooking
                        : null,
                    icon: const Icon(Icons.calendar_month_outlined),
                    label: const Text('Book'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
