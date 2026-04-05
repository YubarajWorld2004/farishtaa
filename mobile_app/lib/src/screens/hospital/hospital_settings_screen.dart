import 'package:flutter/material.dart';

import '../../models/auth_models.dart';
import '../../models/hospital_dashboard_models.dart';
import '../../services/hospital_dashboard_service.dart';

class HospitalSettingsScreen extends StatefulWidget {
  const HospitalSettingsScreen({
    super.key,
    required this.session,
    required this.hospitalService,
  });

  final UserSession session;
  final HospitalDashboardService hospitalService;

  @override
  State<HospitalSettingsScreen> createState() => _HospitalSettingsScreenState();
}

class _HospitalSettingsScreenState extends State<HospitalSettingsScreen> {
  final _hospitalNameController = TextEditingController();
  final _hospitalAddressController = TextEditingController();
  final _hospitalPhoneController = TextEditingController();
  final _hospitalAboutController = TextEditingController();

  HospitalProfileModel? _profile;
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  @override
  void dispose() {
    _hospitalNameController.dispose();
    _hospitalAddressController.dispose();
    _hospitalPhoneController.dispose();
    _hospitalAboutController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final profile = await widget.hospitalService.getProfile(
        token: widget.session.token,
      );

      if (!mounted) {
        return;
      }

      _hospitalNameController.text = profile.hospitalName.isEmpty
          ? profile.displayName
          : profile.hospitalName;
      _hospitalAddressController.text = profile.hospitalAddress;
      _hospitalPhoneController.text = profile.hospitalPhone;
      _hospitalAboutController.text = profile.hospitalAbout;

      setState(() => _profile = profile);
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

  Future<void> _save() async {
    if (_saving) {
      return;
    }

    setState(() => _saving = true);

    try {
      await widget.hospitalService.updateProfile(
        token: widget.session.token,
        payload: {
          'hospitalName': _hospitalNameController.text.trim(),
          'hospitalAddress': _hospitalAddressController.text.trim(),
          'hospitalPhone': _hospitalPhoneController.text.trim(),
          'hospitalAbout': _hospitalAboutController.text.trim(),
        },
      );

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Hospital profile updated.')),
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
          'Hospital Settings',
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 6),
        Text(
          'Update your hospital profile information.',
          style: const TextStyle(color: Colors.black54),
        ),
        const SizedBox(height: 12),
        if (_profile != null && !_profile!.profileCompleted)
          const Card(
            color: Color(0xFFFFF6DD),
            child: Padding(
              padding: EdgeInsets.all(12),
              child: Text(
                'Complete and save your hospital details to finish profile setup.',
              ),
            ),
          ),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              children: [
                TextField(
                  controller: _hospitalNameController,
                  decoration: const InputDecoration(labelText: 'Hospital Name'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _hospitalAddressController,
                  decoration: const InputDecoration(labelText: 'Address'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _hospitalPhoneController,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Phone'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _hospitalAboutController,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'About'),
                ),
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
