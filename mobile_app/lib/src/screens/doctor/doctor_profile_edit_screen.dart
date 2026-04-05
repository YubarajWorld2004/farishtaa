import 'package:flutter/material.dart';

import '../../models/auth_models.dart';
import '../../services/doctor_dashboard_service.dart';
import '../../services/location_service.dart';

const List<String> _specialistOptions = [
  'Cardiologist',
  'Dermatologist',
  'ENT Specialist',
  'Endocrinologist',
  'General Physician',
  'General Practitioner',
  'Gynecologist',
  'Neurologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Psychiatrist',
];

const List<String> _languageOptions = [
  'English',
  'Hindi',
  'Odia',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
];

const List<String> _days = [
  'All Days',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const List<String> _timeOptions = [
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
  '09:30 PM',
  '10:00 PM',
];

class DoctorProfileEditScreen extends StatefulWidget {
  const DoctorProfileEditScreen({
    super.key,
    required this.session,
    required this.dashboardService,
  });

  final UserSession session;
  final DoctorDashboardService dashboardService;

  @override
  State<DoctorProfileEditScreen> createState() =>
      _DoctorProfileEditScreenState();
}

class _DoctorProfileEditScreenState extends State<DoctorProfileEditScreen> {
  final _locationService = LocationService();

  final _experienceController = TextEditingController();
  final _degreeController = TextEditingController();
  final _aboutController = TextEditingController();
  final _addressController = TextEditingController();
  final _photoUrlController = TextEditingController();
  final _mapLinkController = TextEditingController();
  final _feeController = TextEditingController();
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();
  final _clinicController = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  bool _fetchingLocation = false;

  String _specialist = '';
  bool _isHospitalManaged = false;
  List<String> _languages = <String>[];
  List<_AvailabilityInput> _availability = <_AvailabilityInput>[];

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _experienceController.dispose();
    _degreeController.dispose();
    _aboutController.dispose();
    _addressController.dispose();
    _photoUrlController.dispose();
    _mapLinkController.dispose();
    _feeController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    _clinicController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final profile = await widget.dashboardService.getProfile(
        token: widget.session.token,
      );

      if (!mounted) {
        return;
      }

      _specialist = profile.specialist;
      _experienceController.text = profile.experience > 0
          ? '${profile.experience}'
          : '';
      _degreeController.text = profile.degree;
      _aboutController.text = profile.about;
      _addressController.text = profile.address;
      _photoUrlController.text = profile.photoUrl;
      _mapLinkController.text = profile.mapLink;
      _feeController.text = profile.fee > 0 ? '${profile.fee}' : '';
      _latitudeController.text = profile.latitude == null
          ? ''
          : '${profile.latitude}';
      _longitudeController.text = profile.longitude == null
          ? ''
          : '${profile.longitude}';
      _clinicController.text = profile.clinicName;
      _isHospitalManaged = profile.isHospitalManaged;
      _languages = List<String>.from(profile.languages);
      _availability = profile.availability
          .map(
            (slot) => _AvailabilityInput(
              day: slot.day.isEmpty ? 'Monday' : slot.day,
              startTime: slot.startTime.isEmpty ? '09:00 AM' : slot.startTime,
              endTime: slot.endTime.isEmpty ? '05:00 PM' : slot.endTime,
            ),
          )
          .toList();
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

  void _toggleLanguage(String language) {
    setState(() {
      if (_languages.contains(language)) {
        _languages.remove(language);
      } else {
        _languages.add(language);
      }
    });
  }

  void _addAvailability() {
    setState(() {
      _availability = [
        ..._availability,
        const _AvailabilityInput(
          day: 'Monday',
          startTime: '09:00 AM',
          endTime: '05:00 PM',
        ),
      ];
    });
  }

  void _removeAvailability(int index) {
    setState(() {
      _availability = _availability
          .asMap()
          .entries
          .where((entry) => entry.key != index)
          .map((entry) => entry.value)
          .toList();
    });
  }

  void _updateAvailability(int index, _AvailabilityInput updated) {
    setState(() {
      _availability = _availability
          .asMap()
          .entries
          .map((entry) => entry.key == index ? updated : entry.value)
          .toList();
    });
  }

  Future<void> _fillCurrentLocation() async {
    setState(() => _fetchingLocation = true);
    try {
      final location = await _locationService.getCurrentLocation();
      if (!mounted) {
        return;
      }
      _latitudeController.text = location.lat.toString();
      _longitudeController.text = location.lng.toString();
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Location updated.')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _fetchingLocation = false);
      }
    }
  }

  Future<void> _save() async {
    if (_saving) {
      return;
    }

    setState(() => _saving = true);

    try {
      final experience = int.tryParse(_experienceController.text.trim());
      final fee = double.tryParse(_feeController.text.trim());
      final lat = double.tryParse(_latitudeController.text.trim());
      final lng = double.tryParse(_longitudeController.text.trim());

      final payload = <String, dynamic>{
        'specialist': _specialist,
        'experience': experience,
        'degree': _degreeController.text.trim(),
        'languages': _languages,
        'about': _aboutController.text.trim(),
        'address': _addressController.text.trim(),
        'photoUrl': _photoUrlController.text.trim(),
        'mapLink': _mapLinkController.text.trim(),
        'availability': _availability
            .where(
              (slot) =>
                  slot.day.trim().isNotEmpty &&
                  slot.startTime.trim().isNotEmpty &&
                  slot.endTime.trim().isNotEmpty,
            )
            .map((slot) => slot.toJson())
            .toList(),
      };

      if (fee != null) {
        payload['fee'] = fee;
      }

      if (!_isHospitalManaged) {
        payload['clinicName'] = _clinicController.text.trim();
      }

      if (lat != null && lng != null) {
        payload['location'] = {
          'type': 'Point',
          'coordinates': [lng, lat],
        };
      }

      await widget.dashboardService.updateProfile(
        token: widget.session.token,
        payload: payload,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully.')),
      );
      await _bootstrap();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Edit Profile',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        const Text(
          'Keep your profile updated so patients can find and book you.',
          style: TextStyle(color: Colors.black54),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Profile Photo URL',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 30,
                      backgroundImage:
                          _photoUrlController.text.trim().isNotEmpty
                          ? NetworkImage(_photoUrlController.text.trim())
                          : null,
                      child: _photoUrlController.text.trim().isNotEmpty
                          ? null
                          : const Icon(Icons.person_outline),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: _photoUrlController,
                        decoration: const InputDecoration(
                          hintText: 'https://example.com/photo.jpg',
                        ),
                      ),
                    ),
                  ],
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
                  'Professional Details',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                const Text('Specialization'),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _specialistOptions.map((item) {
                    final selected = item == _specialist;
                    return ChoiceChip(
                      label: Text(item),
                      selected: selected,
                      onSelected: (_) => setState(() => _specialist = item),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _feeController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Consultation Fee (Rs)',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _experienceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Years of Experience',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _degreeController,
                  decoration: const InputDecoration(
                    labelText: 'Degree / Qualification',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _clinicController,
                  enabled: !_isHospitalManaged,
                  decoration: InputDecoration(
                    labelText: 'Clinic / Hospital Name',
                    helperText: _isHospitalManaged
                        ? 'Managed by hospital and not editable.'
                        : null,
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
                  'Languages Spoken',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: _languageOptions.map((language) {
                    final selected = _languages.contains(language);
                    return FilterChip(
                      label: Text(language),
                      selected: selected,
                      onSelected: (_) => _toggleLanguage(language),
                    );
                  }).toList(),
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
                  'Additional Information',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _aboutController,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'About'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _addressController,
                  decoration: const InputDecoration(
                    labelText: 'Clinic / Hospital Address',
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _latitudeController,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Latitude',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _longitudeController,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        decoration: const InputDecoration(
                          labelText: 'Longitude',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _fetchingLocation ? null : _fillCurrentLocation,
                  icon: _fetchingLocation
                      ? const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location),
                  label: const Text('Use current location'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _mapLinkController,
                  decoration: const InputDecoration(
                    labelText: 'Google Maps Link',
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
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Availability Slots',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _addAvailability,
                      icon: const Icon(Icons.add),
                      label: const Text('Add slot'),
                    ),
                  ],
                ),
                if (_availability.isEmpty)
                  const Text(
                    'No availability added yet. Add at least one slot window so patients can book appointments.',
                    style: TextStyle(color: Colors.black54),
                  )
                else
                  ..._availability.asMap().entries.map((entry) {
                    final index = entry.key;
                    final slot = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: slot.day,
                              items: _days
                                  .map(
                                    (day) => DropdownMenuItem<String>(
                                      value: day,
                                      child: Text(day),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                _updateAvailability(
                                  index,
                                  slot.copyWith(day: value),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: slot.startTime,
                              items: _timeOptions
                                  .map(
                                    (time) => DropdownMenuItem<String>(
                                      value: time,
                                      child: Text(time),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                _updateAvailability(
                                  index,
                                  slot.copyWith(startTime: value),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: slot.endTime,
                              items: _timeOptions
                                  .map(
                                    (time) => DropdownMenuItem<String>(
                                      value: time,
                                      child: Text(time),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                _updateAvailability(
                                  index,
                                  slot.copyWith(endTime: value),
                                );
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          IconButton(
                            onPressed: () => _removeAvailability(index),
                            icon: const Icon(Icons.delete_outline),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        ElevatedButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Save Changes'),
        ),
      ],
    );
  }
}

class _AvailabilityInput {
  const _AvailabilityInput({
    required this.day,
    required this.startTime,
    required this.endTime,
  });

  final String day;
  final String startTime;
  final String endTime;

  _AvailabilityInput copyWith({
    String? day,
    String? startTime,
    String? endTime,
  }) {
    return _AvailabilityInput(
      day: day ?? this.day,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
    );
  }

  Map<String, String> toJson() {
    return {'day': day, 'startTime': startTime, 'endTime': endTime};
  }
}
