import 'package:flutter/material.dart';

import '../i18n/app_locale_controller.dart';
import '../i18n/app_localizations.dart';
import '../models/auth_models.dart';
import '../services/doctor_dashboard_service.dart';
import '../services/doctor_service.dart';
import '../services/hospital_dashboard_service.dart';
import '../services/patient_service.dart';
import '../theme/app_theme_controller.dart';
import 'account/account_screen.dart';
import 'appointments/my_appointments_screen.dart';
import 'chat/chat_screen.dart';
import 'doctor/doctor_appointments_screen.dart';
import 'doctor/doctor_dashboard_screen.dart';
import 'doctor/doctor_notifications_screen.dart';
import 'doctor/doctor_prescriptions_screen.dart';
import 'doctor/doctor_profile_edit_screen.dart';
import 'doctor/doctor_reviews_screen.dart';
import 'doctor/doctor_telemedicine_screen.dart';
import 'home/home_screen.dart';
import 'hospital/hospital_add_doctor_screen.dart';
import 'hospital/hospital_dashboard_screen.dart';
import 'hospital/hospital_doctors_screen.dart';
import 'hospital/hospital_settings_screen.dart';
import 'notifications/notifications_screen.dart';
import 'prescriptions/prescriptions_screen.dart';
import 'telemedicine/telemedicine_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({
    super.key,
    required this.session,
    required this.doctorService,
    required this.doctorDashboardService,
    required this.hospitalDashboardService,
    required this.patientService,
    required this.onLogout,
    required this.localeController,
    required this.themeController,
  });

  final UserSession session;
  final DoctorService doctorService;
  final DoctorDashboardService doctorDashboardService;
  final HospitalDashboardService hospitalDashboardService;
  final PatientService patientService;
  final VoidCallback onLogout;
  final AppLocaleController localeController;
  final AppThemeController themeController;

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _index = 0;
  String? _doctorTelemedicineSessionId;

  bool get _isPatient => widget.session.userType.toLowerCase() == 'patient';
  bool get _isDoctor => widget.session.userType.toLowerCase() == 'doctor';
  bool get _isHospital => widget.session.userType.toLowerCase() == 'hospital';

  Future<void> _openNotifications() async {
    final l10n = context.l10n;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(l10n.t('title.notifications'))),
          body: SafeArea(
            child: NotificationsScreen(
              session: widget.session,
              patientService: widget.patientService,
              onNavigateFromNotification: (route) {
                Navigator.of(context).pop();
                if (route == 'telemedicine') {
                  setState(() => _index = 2);
                } else {
                  setState(() => _index = 1);
                }
              },
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openPrescriptions() async {
    final l10n = context.l10n;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(l10n.t('title.prescriptions'))),
          body: SafeArea(
            child: PrescriptionsScreen(
              session: widget.session,
              patientService: widget.patientService,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openDoctorProfile() async {
    final l10n = context.l10n;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(l10n.t('title.editProfile'))),
          body: SafeArea(
            child: DoctorProfileEditScreen(
              session: widget.session,
              dashboardService: widget.doctorDashboardService,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openDoctorReviews() async {
    final l10n = context.l10n;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(l10n.t('title.reviews'))),
          body: SafeArea(
            child: DoctorReviewsScreen(
              session: widget.session,
              dashboardService: widget.doctorDashboardService,
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openDoctorNotifications() async {
    final l10n = context.l10n;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(l10n.t('title.notifications'))),
          body: SafeArea(
            child: DoctorNotificationsScreen(
              session: widget.session,
              dashboardService: widget.doctorDashboardService,
              onOpenAppointments: () {
                Navigator.of(context).pop();
                setState(() => _index = 1);
              },
              onOpenTelemedicine: (sessionId) {
                Navigator.of(context).pop();
                setState(() {
                  _doctorTelemedicineSessionId = sessionId;
                  _index = 2;
                });
              },
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final List<Widget> screens;
    final List<NavigationDestination> destinations;

    if (_isPatient) {
      screens = [
        HomeScreen(
          session: widget.session,
          doctorService: widget.doctorService,
          patientService: widget.patientService,
          onOpenChat: () => setState(() => _index = 3),
          onOpenAppointments: () => setState(() => _index = 1),
          onOpenNotifications: _openNotifications,
        ),
        MyAppointmentsScreen(
          session: widget.session,
          patientService: widget.patientService,
        ),
        TelemedicineScreen(
          session: widget.session,
          patientService: widget.patientService,
        ),
        ChatScreen(
          session: widget.session,
          patientService: widget.patientService,
        ),
        AccountScreen(
          session: widget.session,
          onLogout: widget.onLogout,
          onOpenPrescriptions: _openPrescriptions,
          onOpenNotifications: _openNotifications,
          onOpenTelemedicine: () => setState(() => _index = 2),
          localeController: widget.localeController,
          themeController: widget.themeController,
        ),
      ];

      destinations = [
        NavigationDestination(
          icon: const Icon(Icons.home_outlined),
          label: l10n.t('nav.home'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.calendar_month_outlined),
          label: l10n.t('nav.appointments'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.videocam_outlined),
          label: l10n.t('nav.telemed'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.chat_bubble_outline),
          label: l10n.t('nav.chat'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          label: l10n.t('nav.account'),
        ),
      ];
    } else if (_isDoctor) {
      screens = [
        DoctorDashboardScreen(
          session: widget.session,
          dashboardService: widget.doctorDashboardService,
          onOpenProfile: _openDoctorProfile,
          onOpenReviews: _openDoctorReviews,
          onOpenAppointments: () => setState(() => _index = 1),
          onOpenTelemedicine: () => setState(() => _index = 2),
          onOpenPrescriptions: () => setState(() => _index = 3),
          onOpenNotifications: _openDoctorNotifications,
        ),
        DoctorAppointmentsScreen(
          session: widget.session,
          dashboardService: widget.doctorDashboardService,
          onOpenTelemedicineSession: (sessionId) {
            setState(() {
              _doctorTelemedicineSessionId = sessionId;
              _index = 2;
            });
          },
        ),
        DoctorTelemedicineScreen(
          session: widget.session,
          dashboardService: widget.doctorDashboardService,
          initialSessionId: _doctorTelemedicineSessionId,
        ),
        DoctorPrescriptionsScreen(
          session: widget.session,
          dashboardService: widget.doctorDashboardService,
        ),
        AccountScreen(
          session: widget.session,
          onLogout: widget.onLogout,
          onOpenPrescriptions: () => setState(() => _index = 3),
          onOpenNotifications: _openDoctorNotifications,
          onOpenTelemedicine: () => setState(() => _index = 2),
          localeController: widget.localeController,
          themeController: widget.themeController,
        ),
      ];

      destinations = [
        NavigationDestination(
          icon: const Icon(Icons.dashboard_outlined),
          label: l10n.t('nav.dashboard'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.calendar_month_outlined),
          label: l10n.t('nav.appointments'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.videocam_outlined),
          label: l10n.t('nav.telemed'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.receipt_long_outlined),
          label: l10n.t('nav.rx'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          label: l10n.t('nav.account'),
        ),
      ];
      if (_index > 4) {
        _index = 0;
      }
    } else if (_isHospital) {
      screens = [
        HospitalDashboardScreen(
          session: widget.session,
          hospitalService: widget.hospitalDashboardService,
          onOpenDoctors: () => setState(() => _index = 1),
          onOpenAddDoctor: () => setState(() => _index = 2),
          onOpenSettings: () => setState(() => _index = 3),
        ),
        HospitalDoctorsScreen(
          session: widget.session,
          hospitalService: widget.hospitalDashboardService,
          onOpenAddDoctor: () => setState(() => _index = 2),
        ),
        HospitalAddDoctorScreen(
          session: widget.session,
          hospitalService: widget.hospitalDashboardService,
          onAdded: (_) => setState(() => _index = 1),
        ),
        HospitalSettingsScreen(
          session: widget.session,
          hospitalService: widget.hospitalDashboardService,
        ),
        AccountScreen(
          session: widget.session,
          onLogout: widget.onLogout,
          onOpenPrescriptions: () {},
          onOpenNotifications: () {},
          onOpenTelemedicine: () {},
          onOpenHospitalSettings: () => setState(() => _index = 3),
          localeController: widget.localeController,
          themeController: widget.themeController,
        ),
      ];

      destinations = [
        NavigationDestination(
          icon: const Icon(Icons.dashboard_outlined),
          label: l10n.t('nav.dashboard'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.group_outlined),
          label: l10n.t('nav.doctors'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_add_alt_1_outlined),
          label: l10n.t('nav.add'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.settings_outlined),
          label: l10n.t('nav.settings'),
        ),
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          label: l10n.t('nav.account'),
        ),
      ];

      if (_index > 4) {
        _index = 0;
      }
    } else {
      screens = [
        AccountScreen(
          session: widget.session,
          onLogout: widget.onLogout,
          onOpenPrescriptions: () {},
          onOpenNotifications: () {},
          onOpenTelemedicine: () {},
          localeController: widget.localeController,
          themeController: widget.themeController,
        ),
      ];

      destinations = [
        NavigationDestination(
          icon: const Icon(Icons.person_outline),
          label: l10n.t('nav.account'),
        ),
      ];
      _index = 0;
    }

    return Scaffold(
      body: SafeArea(child: screens[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: destinations,
      ),
    );
  }
}
