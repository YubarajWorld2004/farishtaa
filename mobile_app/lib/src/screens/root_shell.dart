import 'package:flutter/material.dart';

import '../models/auth_models.dart';
import '../services/doctor_service.dart';
import '../services/patient_service.dart';
import 'account/account_screen.dart';
import 'chat/chat_screen.dart';
import 'home/home_screen.dart';

class RootShell extends StatefulWidget {
  const RootShell({
    super.key,
    required this.session,
    required this.doctorService,
    required this.patientService,
    required this.onLogout,
  });

  final UserSession session;
  final DoctorService doctorService;
  final PatientService patientService;
  final VoidCallback onLogout;

  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      HomeScreen(
        firstName: widget.session.firstName,
        doctorService: widget.doctorService,
        onOpenChat: () => setState(() => _index = 1),
      ),
      ChatScreen(
        session: widget.session,
        patientService: widget.patientService,
      ),
      AccountScreen(session: widget.session, onLogout: widget.onLogout),
    ];

    return Scaffold(
      body: SafeArea(child: screens[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (index) => setState(() => _index = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            label: 'Chat',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
