import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/appointment_models.dart';
import '../../models/auth_models.dart';
import '../../services/doctor_dashboard_service.dart';
import 'doctor_prescriptions_screen.dart';

class DoctorAppointmentsScreen extends StatefulWidget {
  const DoctorAppointmentsScreen({
    super.key,
    required this.session,
    required this.dashboardService,
    required this.onOpenTelemedicineSession,
  });

  final UserSession session;
  final DoctorDashboardService dashboardService;
  final ValueChanged<String> onOpenTelemedicineSession;

  @override
  State<DoctorAppointmentsScreen> createState() =>
      _DoctorAppointmentsScreenState();
}

class _DoctorAppointmentsScreenState extends State<DoctorAppointmentsScreen> {
  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs ');

  List<AppointmentModel> _appointments = <AppointmentModel>[];
  bool _loading = true;
  String _updatingId = '';
  String _statusFilter = 'all';
  String _paymentFilter = 'all';

  static const _statusOptions = <String>[
    'all',
    'pending',
    'accepted',
    'completed',
    'closed',
    'rejected',
    'cancelled',
  ];

  static const _paymentOptions = <String>[
    'all',
    'paid',
    'pending',
    'not_required',
    'failed',
    'refunded',
  ];

  @override
  void initState() {
    super.initState();
    _fetchAppointments();
  }

  Future<void> _fetchAppointments() async {
    setState(() => _loading = true);
    try {
      final appointments = await widget.dashboardService.getAppointments(
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

  Future<void> _updateStatus({
    required AppointmentModel appointment,
    required String status,
  }) async {
    if (_updatingId.isNotEmpty) {
      return;
    }

    setState(() => _updatingId = appointment.id);
    try {
      await widget.dashboardService.updateAppointmentStatus(
        token: widget.session.token,
        appointmentId: appointment.id,
        status: status,
      );

      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Appointment marked as $status.')));
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
        setState(() => _updatingId = '');
      }
    }
  }

  String _paymentStatus(AppointmentModel appointment) {
    if (appointment.paymentStatus.isNotEmpty) {
      return appointment.paymentStatus;
    }
    if (appointment.paymentRequired) {
      return 'pending';
    }
    return 'not_required';
  }

  String _paymentLabel(String status) {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'not_required':
        return 'No Payment';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
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

  void _showPaymentDetails(AppointmentModel appointment) {
    final paymentStatus = _paymentStatus(appointment);

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
                _detailRow('Status', _paymentLabel(paymentStatus)),
                _detailRow(
                  'Amount',
                  appointment.billedAmountRupees > 0
                      ? _currency.format(appointment.billedAmountRupees)
                      : 'N/A',
                ),
                _detailRow(
                  'Provider',
                  appointment.paymentProvider.isEmpty
                      ? 'N/A'
                      : appointment.paymentProvider,
                ),
                _detailRow(
                  'Order ID',
                  appointment.paymentOrderId.isEmpty
                      ? 'N/A'
                      : appointment.paymentOrderId,
                ),
                _detailRow(
                  'Payment ID',
                  appointment.paymentId.isEmpty ? 'N/A' : appointment.paymentId,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _detailRow(String title, String value) {
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
    final filtered = _appointments.where((appointment) {
      final statusOk =
          _statusFilter == 'all' || appointment.status == _statusFilter;
      final payment = _paymentStatus(appointment);
      final paymentOk = _paymentFilter == 'all' || payment == _paymentFilter;
      return statusOk && paymentOk;
    }).toList();

    final summary = <String, int>{
      'pending': 0,
      'accepted': 0,
      'completed': 0,
      'closed': 0,
      'rejected': 0,
      'cancelled': 0,
    };
    final paymentSummary = <String, int>{
      'paid': 0,
      'pending': 0,
      'not_required': 0,
      'refunded': 0,
    };
    double totalCollected = 0;

    for (final item in _appointments) {
      summary[item.status] = (summary[item.status] ?? 0) + 1;
      final paymentStatus = _paymentStatus(item);
      if (paymentSummary.containsKey(paymentStatus)) {
        paymentSummary[paymentStatus] = paymentSummary[paymentStatus]! + 1;
      }
      if (paymentStatus == 'paid') {
        totalCollected += item.billedAmountRupees;
      }
    }

    return RefreshIndicator(
      onRefresh: _fetchAppointments,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Doctor Appointments',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else ...[
            GridView(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
                childAspectRatio: 1.2,
              ),
              children: [
                _MiniStat(
                  label: 'Pending',
                  value: '${summary['pending']}',
                  color: const Color(0xFFB45309),
                ),
                _MiniStat(
                  label: 'Accepted',
                  value: '${summary['accepted']}',
                  color: const Color(0xFF0F9D58),
                ),
                _MiniStat(
                  label: 'Completed',
                  value: '${summary['completed']}',
                  color: const Color(0xFF1D4ED8),
                ),
                _MiniStat(
                  label: 'Closed',
                  value: '${summary['closed']}',
                  color: const Color(0xFF52525B),
                ),
                _MiniStat(
                  label: 'Rejected',
                  value: '${summary['rejected']}',
                  color: const Color(0xFFB42318),
                ),
                _MiniStat(
                  label: 'Cancelled',
                  value: '${summary['cancelled']}',
                  color: const Color(0xFF52525B),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  children: [
                    Text(
                      'Revenue: ${_currency.format(totalCollected)}',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text('Paid: ${paymentSummary['paid']}'),
                    Text('Pending: ${paymentSummary['pending']}'),
                    Text('No payment: ${paymentSummary['not_required']}'),
                    Text('Refunded: ${paymentSummary['refunded']}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _statusOptions.map((status) {
                final selected = status == _statusFilter;
                return ChoiceChip(
                  label: Text(status == 'all' ? 'All' : status),
                  selected: selected,
                  onSelected: (_) => setState(() => _statusFilter = status),
                );
              }).toList(),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _paymentOptions.map((status) {
                final selected = status == _paymentFilter;
                return ChoiceChip(
                  label: Text(
                    status == 'all' ? 'All payments' : _paymentLabel(status),
                  ),
                  selected: selected,
                  onSelected: (_) => setState(() => _paymentFilter = status),
                );
              }).toList(),
            ),
            const SizedBox(height: 10),
            if (filtered.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text(
                    'No appointments for this status/payment combination.',
                  ),
                ),
              )
            else
              ...filtered.map((appointment) {
                final paymentStatus = _paymentStatus(appointment);
                final relativeSummary = appointment.isRelativeBooking
                    ? '${appointment.relativeDetails?.name ?? ''}${appointment.relativeDetails?.age == null ? '' : ' (${appointment.relativeDetails!.age} yrs)'}${(appointment.relativeDetails?.relation ?? '').isEmpty ? '' : ' • ${appointment.relativeDetails!.relation}'}'
                    : '';

                return Card(
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
                                color: _paymentBg(paymentStatus),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                'PAYMENT: ${_paymentLabel(paymentStatus).toUpperCase()}',
                                style: TextStyle(
                                  color: _paymentFg(paymentStatus),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          appointment.patient.displayName,
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
                        if (relativeSummary.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text('Relative booking: $relativeSummary'),
                        ],
                        if ((appointment.relativeDetails?.importantNotes ?? '')
                            .isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Important notes: ${appointment.relativeDetails!.importantNotes}',
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
                        if (appointment.paymentId.isNotEmpty)
                          Text(
                            'Payment ID: ${appointment.paymentId}',
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
                            OutlinedButton.icon(
                              onPressed: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute<void>(
                                    builder: (_) => Scaffold(
                                      appBar: AppBar(
                                        title: const Text(
                                          'Prescription Center',
                                        ),
                                      ),
                                      body: SafeArea(
                                        child: DoctorPrescriptionsScreen(
                                          session: widget.session,
                                          dashboardService:
                                              widget.dashboardService,
                                          initialAppointmentId: appointment.id,
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.receipt_long_outlined),
                              label: const Text('Prescription'),
                            ),
                            if (appointment.status == 'pending') ...[
                              ElevatedButton.icon(
                                onPressed: _updatingId == appointment.id
                                    ? null
                                    : () => _updateStatus(
                                        appointment: appointment,
                                        status: 'accepted',
                                      ),
                                icon: const Icon(Icons.check_circle_outline),
                                label: const Text('Accept'),
                              ),
                              ElevatedButton.icon(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFB42318),
                                ),
                                onPressed: _updatingId == appointment.id
                                    ? null
                                    : () => _updateStatus(
                                        appointment: appointment,
                                        status: 'rejected',
                                      ),
                                icon: const Icon(Icons.cancel_outlined),
                                label: const Text('Reject'),
                              ),
                            ],
                            if (appointment.status == 'accepted') ...[
                              ElevatedButton.icon(
                                onPressed: _updatingId == appointment.id
                                    ? null
                                    : () => _updateStatus(
                                        appointment: appointment,
                                        status: 'completed',
                                      ),
                                icon: const Icon(Icons.task_alt),
                                label: const Text('Mark Completed'),
                              ),
                              if (appointment.telemedicineSession.isNotEmpty)
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      widget.onOpenTelemedicineSession(
                                        appointment.telemedicineSession,
                                      ),
                                  icon: const Icon(Icons.videocam_outlined),
                                  label: const Text('Open Telemed'),
                                ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  const _MiniStat({
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
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              label,
              style: const TextStyle(fontSize: 11, color: Colors.black54),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(color: color, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ),
    );
  }
}
