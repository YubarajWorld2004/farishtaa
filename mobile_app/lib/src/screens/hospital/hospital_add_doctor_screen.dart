import 'package:flutter/material.dart';

import '../../models/auth_models.dart';
import '../../models/hospital_dashboard_models.dart';
import '../../services/hospital_dashboard_service.dart';
import '../../services/location_service.dart';

const List<String> _specialistOptions = [
  'Cardiologist',
  'Dermatologist',
  'Dentist',
  'ENT',
  'Gastroenterologist',
  'General Physician',
  'Gynecologist',
  'Neurologist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopedic',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Urologist',
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

class HospitalAddDoctorScreen extends StatefulWidget {
  const HospitalAddDoctorScreen({
    super.key,
    required this.session,
    required this.hospitalService,
    required this.onAdded,
  });

  final UserSession session;
  final HospitalDashboardService hospitalService;
  final ValueChanged<HospitalDoctorModel> onAdded;

  @override
  State<HospitalAddDoctorScreen> createState() =>
      _HospitalAddDoctorScreenState();
}

class _HospitalAddDoctorScreenState extends State<HospitalAddDoctorScreen> {
  final _locationService = LocationService();

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _experienceController = TextEditingController();
  final _degreeController = TextEditingController();
  final _languagesController = TextEditingController();
  final _aboutController = TextEditingController();
  final _addressController = TextEditingController();
  final _photoUrlController = TextEditingController();
  final _mapLinkController = TextEditingController();
  final _feeController = TextEditingController();
  final _latitudeController = TextEditingController();
  final _longitudeController = TextEditingController();

  String _specialist = '';
  bool _submitting = false;
  bool _fetchingLocation = false;
  bool _showPassword = false;

  List<_AvailabilityInput> _availability = <_AvailabilityInput>[];

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _experienceController.dispose();
    _degreeController.dispose();
    _languagesController.dispose();
    _aboutController.dispose();
    _addressController.dispose();
    _photoUrlController.dispose();
    _mapLinkController.dispose();
    _feeController.dispose();
    _latitudeController.dispose();
    _longitudeController.dispose();
    super.dispose();
  }

  void _addSlot() {
    setState(() {
      _availability = [
        ..._availability,
        _AvailabilityInput(
          day: 'Monday',
          startTime: '09:00 AM',
          endTime: '05:00 PM',
        ),
      ];
    });
  }

  void _removeSlot(int index) {
    setState(() {
      _availability = _availability
          .asMap()
          .entries
          .where((entry) => entry.key != index)
          .map((entry) => entry.value)
          .toList();
    });
  }

  void _updateSlot(int index, _AvailabilityInput slot) {
    setState(() {
      _availability = _availability
          .asMap()
          .entries
          .map((entry) => entry.key == index ? slot : entry.value)
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

  Future<void> _submit() async {
    if (_submitting) {
      return;
    }

    if (_firstNameController.text.trim().isEmpty ||
        _emailController.text.trim().isEmpty ||
        _passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('First name, email and password are required.'),
        ),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final experience = int.tryParse(_experienceController.text.trim());
      final fee = double.tryParse(_feeController.text.trim());
      final lat = double.tryParse(_latitudeController.text.trim());
      final lng = double.tryParse(_longitudeController.text.trim());

      final payload = <String, dynamic>{
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text.trim(),
        'specialist': _specialist,
        'experience': experience,
        'degree': _degreeController.text.trim(),
        'languages': _languagesController.text
            .split(',')
            .map((value) => value.trim())
            .where((value) => value.isNotEmpty)
            .toList(),
        'about': _aboutController.text.trim(),
        'address': _addressController.text.trim(),
        'photoUrl': _photoUrlController.text.trim(),
        'mapLink': _mapLinkController.text.trim(),
        'fee': fee,
        'availability': _availability.map((slot) => slot.toJson()).toList(),
      };

      if (lat != null && lng != null) {
        payload['location'] = {
          'type': 'Point',
          'coordinates': [lng, lat],
        };
      }

      final doctor = await widget.hospitalService.addDoctor(
        token: widget.session.token,
        payload: payload,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Dr. ${doctor.fullName} added successfully.')),
      );
      widget.onAdded(doctor);
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Add Doctor',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        const Text(
          'Register a doctor under your hospital.',
          style: TextStyle(color: Colors.black54),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _firstNameController,
                        decoration: const InputDecoration(
                          labelText: 'First Name *',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _lastNameController,
                        decoration: const InputDecoration(
                          labelText: 'Last Name',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email *'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _passwordController,
                  obscureText: !_showPassword,
                  decoration: InputDecoration(
                    labelText: 'Password *',
                    suffixIcon: IconButton(
                      onPressed: () {
                        setState(() => _showPassword = !_showPassword);
                      },
                      icon: Icon(
                        _showPassword ? Icons.visibility_off : Icons.visibility,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: _specialist.isEmpty ? null : _specialist,
                  decoration: const InputDecoration(
                    labelText: 'Specialization',
                  ),
                  items: _specialistOptions
                      .map(
                        (item) => DropdownMenuItem<String>(
                          value: item,
                          child: Text(item),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    setState(() => _specialist = value ?? '');
                  },
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _experienceController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Experience (years)',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _feeController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Consultation Fee (Rs)',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _degreeController,
                  decoration: const InputDecoration(labelText: 'Degree'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _languagesController,
                  decoration: const InputDecoration(
                    labelText: 'Languages (comma separated)',
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _addressController,
                  decoration: const InputDecoration(labelText: 'Address'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _photoUrlController,
                  decoration: const InputDecoration(labelText: 'Photo URL'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _mapLinkController,
                  decoration: const InputDecoration(
                    labelText: 'Google Maps Link',
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
                const SizedBox(height: 6),
                Align(
                  alignment: Alignment.centerLeft,
                  child: TextButton.icon(
                    onPressed: _fetchingLocation ? null : _fillCurrentLocation,
                    icon: _fetchingLocation
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.my_location),
                    label: const Text('Use Current Location'),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _aboutController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'About'),
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
                        'Availability',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    TextButton.icon(
                      onPressed: _addSlot,
                      icon: const Icon(Icons.add),
                      label: const Text('Add Slot'),
                    ),
                  ],
                ),
                if (_availability.isEmpty)
                  const Text(
                    'No availability slots added yet.',
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
                                    (value) => DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                _updateSlot(index, slot.copyWith(day: value));
                              },
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: slot.startTime,
                              items: _timeOptions
                                  .map(
                                    (value) => DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                _updateSlot(
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
                                    (value) => DropdownMenuItem<String>(
                                      value: value,
                                      child: Text(value),
                                    ),
                                  )
                                  .toList(),
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                _updateSlot(
                                  index,
                                  slot.copyWith(endTime: value),
                                );
                              },
                            ),
                          ),
                          IconButton(
                            onPressed: () => _removeSlot(index),
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
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('Add Doctor'),
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
