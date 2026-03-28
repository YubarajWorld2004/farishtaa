import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/doctor.dart';
import '../../theme/app_theme.dart';

class DoctorProfileScreen extends StatelessWidget {
  const DoctorProfileScreen({
    super.key,
    required this.doctor,
  });

  final DoctorListItem doctor;

  Future<void> _openDirections(BuildContext context) async {
    final lat = doctor.latitude;
    final lng = doctor.longitude;
    if (lat == null || lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Directions are unavailable for this doctor')),
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
    return Scaffold(
      appBar: AppBar(title: const Text('Doctor Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 34,
                backgroundColor: const Color(0xFFD1F0EF),
                backgroundImage: doctor.photoUrl.isNotEmpty
                    ? NetworkImage(doctor.photoUrl)
                    : null,
                child: doctor.photoUrl.isEmpty
                    ? Text(
                        doctor.name.substring(0, 1).toUpperCase(),
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
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctor.speciality,
                      style: const TextStyle(
                        color: AppTheme.dangerRed,
                        fontWeight: FontWeight.w700,
                      ),
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
          const SizedBox(height: 18),
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
                      const Icon(Icons.star_rounded, color: Color(0xFF0F9D58)),
                      const SizedBox(width: 6),
                      Text(
                        doctor.rating == 0
                            ? 'New'
                            : doctor.rating.toStringAsFixed(1),
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(width: 8),
                      Text('(${doctor.reviewCount} reviews)'),
                    ],
                  ),
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
          const SizedBox(height: 12),
          if (doctor.languages.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Languages',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: doctor.languages
                          .map((lang) => Chip(label: Text(lang)))
                          .toList(),
                    ),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 12),
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
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: FilledButton.icon(
            onPressed: () => _openDirections(context),
            icon: const Icon(Icons.directions),
            label: const Text('Directions'),
          ),
        ),
      ),
    );
  }
}
