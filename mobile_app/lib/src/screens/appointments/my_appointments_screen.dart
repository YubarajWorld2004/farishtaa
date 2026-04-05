import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/appointment_models.dart';
import '../../models/auth_models.dart';
import '../../services/patient_service.dart';
import '../telemedicine/telemedicine_screen.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({
    super.key,
    required this.session,
    required this.patientService,
  });

  final UserSession session;
  final PatientService patientService;

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs ');

  List<AppointmentModel> _appointments = <AppointmentModel>[];
  bool _loading = true;
  String _actionId = '';

  @override
  void initState() {
    super.initState();
    if (_canUsePatientAppointments) {
      _fetchAppointments();
    }
  }

  bool get _canUsePatientAppointments =>
      widget.session.userType.toLowerCase() == 'patient';

  Future<void> _fetchAppointments() async {
    setState(() => _loading = true);
    try {
      final appointments = await widget.patientService.getAppointments(
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _appointments = appointments);
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

  Future<void> _cancelAppointment(AppointmentModel appointment) async {
    setState(() => _actionId = appointment.id);
    try {
      await widget.patientService.cancelAppointment(
        token: widget.session.token,
        appointmentId: appointment.id,
      );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Appointment cancelled successfully.')),
      );
      await _fetchAppointments();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _actionId = '');
      }
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'accepted':
        return const Color(0xFFE7F9EF);
      case 'rejected':
        return const Color(0xFFFFEBEE);
      case 'cancelled':
      case 'closed':
        return const Color(0xFFF4F4F5);
      case 'completed':
        return const Color(0xFFE8F1FF);
      default:
        return const Color(0xFFFFF8E1);
    }
  }

  Color _statusFg(String status) {
    switch (status) {
      case 'accepted':
        return const Color(0xFF0F9D58);
      case 'rejected':
        return const Color(0xFFB42318);
      case 'cancelled':
      case 'closed':
        return const Color(0xFF52525B);
      case 'completed':
        return const Color(0xFF1D4ED8);
      default:
        return const Color(0xFFB45309);
    }
  }

  Color _paymentBg(String status) {
    switch (status) {
      case 'paid':
        return const Color(0xFFE7F9EF);
      case 'pending':
        return const Color(0xFFFFF8E1);
      case 'failed':
        return const Color(0xFFFFEBEE);
      case 'refunded':
        return const Color(0xFFE8F1FF);
      default:
        return const Color(0xFFF4F4F5);
    }
  }

  Color _paymentFg(String status) {
    switch (status) {
      case 'paid':
        return const Color(0xFF0F9D58);
      case 'pending':
        return const Color(0xFFB45309);
      case 'failed':
        return const Color(0xFFB42318);
      case 'refunded':
        return const Color(0xFF1D4ED8);
      default:
        return const Color(0xFF52525B);
    }
  }

  String _paymentLabel(String status) {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return 'No Payment';
    }
  }

  void _showPaymentDetails(AppointmentModel appointment) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (_) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 6, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Payment Details',
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 12),
                _paymentRow(
                  'Status',
                  _paymentLabel(appointment.resolvedPaymentStatus),
                ),
                _paymentRow(
                  'Amount',
                  appointment.billedAmountRupees > 0
                      ? _currency.format(appointment.billedAmountRupees)
                      : 'N/A',
                ),
                _paymentRow(
                  'Provider',
                  appointment.paymentProvider.isEmpty
                      ? 'N/A'
                      : appointment.paymentProvider,
                ),
                _paymentRow(
                  'Order ID',
                  appointment.paymentOrderId.isEmpty
                      ? 'N/A'
                      : appointment.paymentOrderId,
                ),
                _paymentRow(
                  'Payment ID',
                  appointment.paymentId.isEmpty ? 'N/A' : appointment.paymentId,
                ),
                _paymentRow('Currency', appointment.paymentCurrency),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _paymentRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(width: 96, child: Text(title)),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_canUsePatientAppointments) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'Appointments are currently available for Patient accounts only.',
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    final totalPaid = _appointments
        .where((item) => item.resolvedPaymentStatus == 'paid')
        .fold<double>(
          0,
          (previous, item) => previous + item.billedAmountRupees,
        );

    final paidCount = _appointments
        .where((item) => item.resolvedPaymentStatus == 'paid')
        .length;
    final pendingCount = _appointments
        .where((item) => item.resolvedPaymentStatus == 'pending')
        .length;
    final noPaymentCount = _appointments
        .where((item) => item.resolvedPaymentStatus == 'not_required')
        .length;

    return RefreshIndicator(
      onRefresh: _fetchAppointments,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'My Appointments',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          GridView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.7,
            ),
            children: [
              _MetricCard(
                label: 'Paid',
                value: '$paidCount',
                color: const Color(0xFF0F9D58),
              ),
              _MetricCard(
                label: 'Pending',
                value: '$pendingCount',
                color: const Color(0xFFB45309),
              ),
              _MetricCard(
                label: 'No Payment',
                value: '$noPaymentCount',
                color: const Color(0xFF52525B),
              ),
              _MetricCard(
                label: 'Total Paid',
                value: _currency.format(totalPaid),
                color: const Color(0xFF1D4ED8),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_appointments.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No appointments found yet.'),
              ),
            )
          else
            ..._appointments.map(
              (appointment) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: _statusBg(appointment.status),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              appointment.status.toUpperCase(),
                              style: TextStyle(
                                color: _statusFg(appointment.status),
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: _paymentBg(
                                appointment.resolvedPaymentStatus,
                              ),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              'PAYMENT: ${_paymentLabel(appointment.resolvedPaymentStatus).toUpperCase()}',
                              style: TextStyle(
                                color: _paymentFg(
                                  appointment.resolvedPaymentStatus,
                                ),
                                fontWeight: FontWeight.w700,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        appointment.doctor.displayName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${appointment.appointmentDate} | ${appointment.slotTime}',
                      ),
                      if (appointment.reason.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text('Reason: ${appointment.reason}'),
                      ],
                      if (appointment.isRelativeBooking) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Relative: ${appointment.relativeDetails?.name ?? 'N/A'}'
                          '${appointment.relativeDetails?.age == null ? '' : ' (${appointment.relativeDetails!.age} yrs)'}',
                        ),
                        if ((appointment.relativeDetails?.importantNotes ?? '')
                            .isNotEmpty)
                          Text(
                            'Notes: ${appointment.relativeDetails!.importantNotes}',
                          ),
                      ],
                      const SizedBox(height: 6),
                      Text(
                        'Amount: ${appointment.billedAmountRupees > 0 ? _currency.format(appointment.billedAmountRupees) : '-'}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.black54,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton(
                            onPressed: () => _showPaymentDetails(appointment),
                            child: const Text('View Payment'),
                          ),
                          if (appointment.canOpenTelemedicine)
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => Scaffold(
                                      appBar: AppBar(
                                        title: const Text('Telemedicine'),
                                      ),
                                      body: SafeArea(
                                        child: TelemedicineScreen(
                                          session: widget.session,
                                          patientService: widget.patientService,
                                          initialSessionId:
                                              appointment.telemedicineSession,
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.videocam_outlined),
                              label: const Text('Telemedicine'),
                            ),
                          if (appointment.canCancel)
                            OutlinedButton.icon(
                              onPressed: _actionId == appointment.id
                                  ? null
                                  : () => _cancelAppointment(appointment),
                              icon: _actionId == appointment.id
                                  ? const SizedBox(
                                      width: 14,
                                      height: 14,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Icon(Icons.cancel_outlined),
                              label: const Text('Cancel'),
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

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontWeight: FontWeight.w800, color: color),
            ),
          ],
        ),
      ),
    );
  }
}
