import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_config.dart';
import '../../models/appointment_models.dart';
import '../../models/auth_models.dart';
import '../../models/prescription_models.dart';
import '../../services/doctor_dashboard_service.dart';

class DoctorPrescriptionsScreen extends StatefulWidget {
  const DoctorPrescriptionsScreen({
    super.key,
    required this.session,
    required this.dashboardService,
  });

  final UserSession session;
  final DoctorDashboardService dashboardService;

  @override
  State<DoctorPrescriptionsScreen> createState() =>
      _DoctorPrescriptionsScreenState();
}

class _DoctorPrescriptionsScreenState extends State<DoctorPrescriptionsScreen> {
  final _diagnosisController = TextEditingController();
  final _notesController = TextEditingController();
  final _patientIdController = TextEditingController();

  List<PrescriptionModel> _prescriptions = <PrescriptionModel>[];
  List<AppointmentModel> _appointments = <AppointmentModel>[];
  List<_MedicineInput> _medicines = <_MedicineInput>[_MedicineInput.empty()];

  String _selectedAppointmentId = '';
  File? _selectedFile;

  bool _loading = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _diagnosisController.dispose();
    _notesController.dispose();
    _patientIdController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait<dynamic>([
        widget.dashboardService.getPrescriptions(token: widget.session.token),
        widget.dashboardService.getAppointments(token: widget.session.token),
      ]);

      if (!mounted) {
        return;
      }

      final appointments = (results[1] as List<AppointmentModel>)
          .where(
            (item) => item.status == 'accepted' || item.status == 'completed',
          )
          .toList();

      setState(() {
        _prescriptions = results[0] as List<PrescriptionModel>;
        _appointments = appointments;
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

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles();
    if (result == null || result.files.isEmpty) {
      return;
    }

    final path = result.files.single.path;
    if (path == null) {
      return;
    }

    setState(() => _selectedFile = File(path));
  }

  void _setAppointment(String appointmentId) {
    setState(() {
      _selectedAppointmentId = appointmentId;
    });

    AppointmentModel? selected;
    for (final item in _appointments) {
      if (item.id == appointmentId) {
        selected = item;
        break;
      }
    }

    _patientIdController.text = selected?.patient.id ?? '';
  }

  void _updateMedicine(int index, _MedicineInput medicine) {
    setState(() {
      _medicines = _medicines
          .asMap()
          .entries
          .map((entry) => entry.key == index ? medicine : entry.value)
          .toList();
    });
  }

  void _addMedicine() {
    setState(() => _medicines = [..._medicines, _MedicineInput.empty()]);
  }

  void _removeMedicine(int index) {
    if (_medicines.length == 1) {
      return;
    }
    setState(() {
      _medicines = _medicines
          .asMap()
          .entries
          .where((entry) => entry.key != index)
          .map((entry) => entry.value)
          .toList();
    });
  }

  Future<void> _submit() async {
    if (_submitting) {
      return;
    }

    if (_patientIdController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Select an appointment or enter patient ID.'),
        ),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final medicines = _medicines
          .where((item) => item.name.trim().isNotEmpty)
          .map((item) => item.toMap())
          .toList();

      await widget.dashboardService.createPrescription(
        token: widget.session.token,
        patientId: _patientIdController.text.trim(),
        appointmentId: _selectedAppointmentId,
        diagnosis: _diagnosisController.text.trim(),
        notes: _notesController.text.trim(),
        medicines: medicines,
        file: _selectedFile,
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Prescription created successfully.')),
      );

      setState(() {
        _selectedAppointmentId = '';
        _selectedFile = null;
        _medicines = <_MedicineInput>[_MedicineInput.empty()];
      });
      _patientIdController.clear();
      _diagnosisController.clear();
      _notesController.clear();

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
        setState(() => _submitting = false);
      }
    }
  }

  String _toAbsolute(String value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    final base = AppConfig.baseUrl.replaceFirst(RegExp(r'/$'), '');
    final path = value.startsWith('/') ? value : '/$value';
    return '$base$path';
  }

  Future<void> _openUrl(String value) async {
    final uri = Uri.parse(_toAbsolute(value));
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not open file.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.session.userType.toLowerCase() != 'doctor') {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text(
            'Prescriptions are currently available for Doctor accounts.',
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _bootstrap,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Prescription Center',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          const Text(
            'Create digital prescriptions and review previous records.',
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
                    'Create Prescription',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedAppointmentId.isEmpty
                        ? null
                        : _selectedAppointmentId,
                    decoration: const InputDecoration(labelText: 'Appointment'),
                    items: [
                      const DropdownMenuItem<String>(
                        value: '',
                        child: Text('Select appointment'),
                      ),
                      ..._appointments.map(
                        (appointment) => DropdownMenuItem<String>(
                          value: appointment.id,
                          child: Text(
                            '${appointment.patient.displayName} • ${appointment.appointmentDate} ${appointment.slotTime}',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ),
                    ],
                    onChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      _setAppointment(value);
                    },
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _patientIdController,
                    decoration: const InputDecoration(
                      labelText: 'Patient ID (fallback/manual)',
                    ),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _diagnosisController,
                    decoration: const InputDecoration(labelText: 'Diagnosis'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Clinical notes',
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Medicines',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _addMedicine,
                        icon: const Icon(Icons.add),
                        label: const Text('Add medicine'),
                      ),
                    ],
                  ),
                  ..._medicines.asMap().entries.map((entry) {
                    final index = entry.key;
                    final medicine = entry.value;
                    return Padding(
                      key: ValueKey(medicine.uid),
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Column(
                        children: [
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Name',
                            ),
                            initialValue: medicine.name,
                            onChanged: (value) => _updateMedicine(
                              index,
                              medicine.copyWith(name: value),
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Dosage',
                            ),
                            initialValue: medicine.dosage,
                            onChanged: (value) => _updateMedicine(
                              index,
                              medicine.copyWith(dosage: value),
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Frequency',
                            ),
                            initialValue: medicine.frequency,
                            onChanged: (value) => _updateMedicine(
                              index,
                              medicine.copyWith(frequency: value),
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Duration',
                            ),
                            initialValue: medicine.duration,
                            onChanged: (value) => _updateMedicine(
                              index,
                              medicine.copyWith(duration: value),
                            ),
                          ),
                          const SizedBox(height: 6),
                          TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Instructions',
                            ),
                            initialValue: medicine.instructions,
                            onChanged: (value) => _updateMedicine(
                              index,
                              medicine.copyWith(instructions: value),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () => _removeMedicine(index),
                              icon: const Icon(Icons.delete_outline),
                              label: const Text('Remove'),
                            ),
                          ),
                          const Divider(),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      OutlinedButton.icon(
                        onPressed: _pickFile,
                        icon: const Icon(Icons.attach_file),
                        label: const Text('Attach File'),
                      ),
                      if (_selectedFile != null)
                        Chip(label: Text(_selectedFile!.path.split('\\').last)),
                    ],
                  ),
                  const SizedBox(height: 12),
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
                        : const Text('Create Prescription'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_prescriptions.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No prescriptions found yet.'),
              ),
            )
          else
            ..._prescriptions.map(
              (item) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.patientName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        DateFormat(
                          'dd MMM yyyy, h:mm a',
                        ).format(item.issuedAt ?? DateTime.now()),
                        style: const TextStyle(color: Colors.black54),
                      ),
                      if (item.diagnosis.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text('Diagnosis: ${item.diagnosis}'),
                      ],
                      if (item.medicines.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text('Medicines: ${item.medicines.length}'),
                      ],
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          if (item.file != null)
                            OutlinedButton.icon(
                              onPressed: () => _openUrl(item.file!.fileUrl),
                              icon: const Icon(Icons.download_outlined),
                              label: const Text('Open File'),
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

class _MedicineInput {
  _MedicineInput({
    required this.uid,
    this.name = '',
    this.dosage = '',
    this.frequency = '',
    this.duration = '',
    this.instructions = '',
  });

  factory _MedicineInput.empty() {
    return _MedicineInput(
      uid: DateTime.now().microsecondsSinceEpoch.toString(),
    );
  }

  final String uid;

  final String name;
  final String dosage;
  final String frequency;
  final String duration;
  final String instructions;

  _MedicineInput copyWith({
    String? name,
    String? dosage,
    String? frequency,
    String? duration,
    String? instructions,
  }) {
    return _MedicineInput(
      uid: uid,
      name: name ?? this.name,
      dosage: dosage ?? this.dosage,
      frequency: frequency ?? this.frequency,
      duration: duration ?? this.duration,
      instructions: instructions ?? this.instructions,
    );
  }

  Map<String, String> toMap() {
    return {
      'name': name,
      'dosage': dosage,
      'frequency': frequency,
      'duration': duration,
      'instructions': instructions,
    };
  }
}
