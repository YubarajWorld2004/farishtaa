import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../../models/appointment_models.dart';
import '../../models/auth_models.dart';
import '../../models/doctor.dart';
import '../../services/doctor_service.dart';
import '../../services/patient_service.dart';
import '../../theme/app_theme.dart';

class BookAppointmentScreen extends StatefulWidget {
  const BookAppointmentScreen({
    super.key,
    required this.session,
    required this.doctorService,
    required this.patientService,
    required this.doctorId,
  });

  final UserSession session;
  final DoctorService doctorService;
  final PatientService patientService;
  final String doctorId;

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final _reasonController = TextEditingController();
  final _relativeNameController = TextEditingController();
  final _relativeAgeController = TextEditingController();
  final _relativeRelationController = TextEditingController();
  final _relativeNotesController = TextEditingController();

  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

  final Razorpay _razorpay = Razorpay();
  Completer<PaymentSuccessResponse>? _paymentCompleter;

  DoctorListItem? _doctor;
  List<String> _slots = <String>[];

  bool _loadingDoctor = true;
  bool _loadingSlots = false;
  bool _submitting = false;

  String _meetingType = 'online';
  String _appointmentFor = 'self';
  String _selectedSlot = '';
  DateTime _appointmentDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
    _bootstrap();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _relativeNameController.dispose();
    _relativeAgeController.dispose();
    _relativeRelationController.dispose();
    _relativeNotesController.dispose();
    _razorpay.clear();
    super.dispose();
  }

  bool get _bookingForRelative => _appointmentFor == 'relative';

  String get _dateText => DateFormat('yyyy-MM-dd').format(_appointmentDate);

  Future<void> _bootstrap() async {
    setState(() => _loadingDoctor = true);
    try {
      final doctor = await widget.doctorService.getDoctorById(
        doctorId: widget.doctorId,
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _doctor = doctor);
      await _loadSlots();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _loadingDoctor = false);
      }
    }
  }

  Future<void> _loadSlots() async {
    if (_doctor == null) {
      return;
    }

    setState(() {
      _loadingSlots = true;
      _selectedSlot = '';
    });

    try {
      final slots = await widget.patientService.getDoctorAvailableSlots(
        doctorId: _doctor!.id,
        date: _dateText,
        token: widget.session.token,
      );

      if (!mounted) {
        return;
      }
      setState(() => _slots = slots);
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() => _slots = <String>[]);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _loadingSlots = false);
      }
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _appointmentDate.isBefore(now) ? now : _appointmentDate,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 90)),
    );

    if (picked == null) {
      return;
    }

    setState(() => _appointmentDate = picked);
    await _loadSlots();
  }

  String? _validateRelativeInputs() {
    if (!_bookingForRelative) {
      return null;
    }

    final relativeName = _relativeNameController.text.trim();
    final age = int.tryParse(_relativeAgeController.text.trim());

    if (relativeName.isEmpty) {
      return 'Relative name is required';
    }
    if (age == null || age < 0 || age > 130) {
      return 'Relative age must be between 0 and 130';
    }

    return null;
  }

  Future<PaymentSuccessResponse> _openCheckout({
    required AppointmentPaymentOrder order,
    required String doctorName,
  }) async {
    final completer = Completer<PaymentSuccessResponse>();
    _paymentCompleter = completer;

    final options = {
      'key': order.keyId,
      'amount': order.amount,
      'order_id': order.orderId,
      'currency': order.currency,
      'name': 'Farishtaa',
      'description': 'Appointment with $doctorName',
      'prefill': {'name': widget.session.firstName},
      'theme': {'color': '#DE1B2C'},
    };

    _razorpay.open(options);

    final result = await completer.future;
    _paymentCompleter = null;
    return result;
  }

  void _onPaymentSuccess(PaymentSuccessResponse response) {
    final completer = _paymentCompleter;
    if (completer == null || completer.isCompleted) {
      return;
    }
    completer.complete(response);
  }

  void _onPaymentError(PaymentFailureResponse response) {
    final completer = _paymentCompleter;
    if (completer == null || completer.isCompleted) {
      return;
    }

    final message = response.message ?? 'Payment was cancelled or failed';
    completer.completeError(Exception(message));
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    final completer = _paymentCompleter;
    if (completer == null || completer.isCompleted) {
      return;
    }

    completer.completeError(
      Exception('External wallet flow is not supported for booking yet.'),
    );
  }

  Future<void> _submit() async {
    final doctor = _doctor;
    if (doctor == null || _selectedSlot.isEmpty || _submitting) {
      return;
    }

    final relativeError = _validateRelativeInputs();
    if (relativeError != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(relativeError)));
      return;
    }

    setState(() => _submitting = true);

    try {
      final relativeAge = int.tryParse(_relativeAgeController.text.trim());

      if (doctor.fee > 0) {
        final order = await widget.patientService.createAppointmentPaymentOrder(
          token: widget.session.token,
          doctorId: doctor.id,
          appointmentDate: _dateText,
          slotTime: _selectedSlot,
        );

        final payment = await _openCheckout(
          order: order,
          doctorName: doctor.name,
        );

        final orderId = payment.orderId;
        final paymentId = payment.paymentId;
        final signature = payment.signature;

        if (orderId == null || paymentId == null || signature == null) {
          throw Exception(
            'Payment completed but verification fields were missing.',
          );
        }

        await widget.patientService.verifyAppointmentPaymentAndBook(
          token: widget.session.token,
          doctorId: doctor.id,
          appointmentDate: _dateText,
          slotTime: _selectedSlot,
          meetingType: _meetingType,
          appointmentFor: _appointmentFor,
          reason: _reasonController.text.trim(),
          relativeName: _relativeNameController.text.trim(),
          relativeAge: relativeAge,
          relativeRelation: _relativeRelationController.text.trim(),
          relativeImportantThings: _relativeNotesController.text.trim(),
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
        );
      } else {
        await widget.patientService.bookAppointment(
          token: widget.session.token,
          doctorId: doctor.id,
          appointmentDate: _dateText,
          slotTime: _selectedSlot,
          meetingType: _meetingType,
          appointmentFor: _appointmentFor,
          reason: _reasonController.text.trim(),
          relativeName: _relativeNameController.text.trim(),
          relativeAge: relativeAge,
          relativeRelation: _relativeRelationController.text.trim(),
          relativeImportantThings: _relativeNotesController.text.trim(),
        );
      }

      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Appointment request submitted successfully.'),
        ),
      );
      Navigator.of(context).pop(true);
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
    if (_loadingDoctor) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final doctor = _doctor;
    if (doctor == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Book Appointment')),
        body: const Center(child: Text('Doctor profile could not be loaded.')),
      );
    }

    final bookingEnabled = doctor.supportsOnlineBooking;

    return Scaffold(
      appBar: AppBar(title: const Text('Book Appointment')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundImage: doctor.photoUrl.isNotEmpty
                        ? NetworkImage(doctor.photoUrl)
                        : null,
                    child: doctor.photoUrl.isEmpty
                        ? Text(
                            doctor.name.isEmpty
                                ? 'D'
                                : doctor.name[0].toUpperCase(),
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
                        if (doctor.speciality.isNotEmpty)
                          Text(
                            doctor.speciality,
                            style: const TextStyle(color: AppTheme.dangerRed),
                          ),
                        if (doctor.fee > 0)
                          Text(
                            'Consultation fee: ${_currency.format(doctor.fee)}',
                            style: const TextStyle(
                              color: Color(0xFF0F9D58),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (!bookingEnabled)
            const Card(
              color: Color(0xFFFFF6DD),
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Text(
                  'Online appointment booking is currently unavailable for this profile.',
                ),
              ),
            ),
          if (!bookingEnabled) const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _submitting ? null : _pickDate,
                  icon: const Icon(Icons.calendar_month_outlined),
                  label: Text(_dateText),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'online', label: Text('Online')),
              ButtonSegment(value: 'in-person', label: Text('In-Person')),
            ],
            selected: {_meetingType},
            onSelectionChanged: _submitting
                ? null
                : (value) => setState(() => _meetingType = value.first),
          ),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'self', label: Text('Myself')),
              ButtonSegment(value: 'relative', label: Text('Relative')),
            ],
            selected: {_appointmentFor},
            onSelectionChanged: _submitting
                ? null
                : (value) => setState(() => _appointmentFor = value.first),
          ),
          if (_bookingForRelative) ...[
            const SizedBox(height: 12),
            TextField(
              controller: _relativeNameController,
              decoration: const InputDecoration(labelText: 'Relative name'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _relativeAgeController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Relative age'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _relativeRelationController,
              decoration: const InputDecoration(
                labelText: 'Relation (optional)',
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _relativeNotesController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Important notes (optional)',
              ),
            ),
          ],
          const SizedBox(height: 14),
          Row(
            children: [
              Text(
                'Available slots',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(width: 8),
              if (_loadingSlots)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (!_loadingSlots && _slots.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(12),
                child: Text('No slots available for selected date.'),
              ),
            ),
          if (_slots.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _slots
                  .map(
                    (slot) => ChoiceChip(
                      label: Text(slot),
                      selected: _selectedSlot == slot,
                      onSelected: _submitting
                          ? null
                          : (_) => setState(() => _selectedSlot = slot),
                    ),
                  )
                  .toList(),
            ),
          const SizedBox(height: 14),
          TextField(
            controller: _reasonController,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Reason / symptoms (optional)',
            ),
          ),
          const SizedBox(height: 18),
          ElevatedButton(
            onPressed: (!bookingEnabled || _selectedSlot.isEmpty || _submitting)
                ? null
                : _submit,
            child: _submitting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : Text(
                    doctor.fee > 0
                        ? 'Pay ${_currency.format(doctor.fee)} & Confirm'
                        : 'Confirm Appointment',
                  ),
          ),
        ],
      ),
    );
  }
}
