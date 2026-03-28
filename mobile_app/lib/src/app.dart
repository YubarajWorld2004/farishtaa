import 'package:flutter/material.dart';

import 'models/auth_models.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/root_shell.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/auth_storage.dart';
import 'services/doctor_service.dart';
import 'services/patient_service.dart';
import 'theme/app_theme.dart';

void runFarishtaaApp() {
  runApp(const FarishtaaApp());
}

class FarishtaaApp extends StatefulWidget {
  const FarishtaaApp({super.key});

  @override
  State<FarishtaaApp> createState() => _FarishtaaAppState();
}

class _FarishtaaAppState extends State<FarishtaaApp> {
  final _authStorage = AuthStorage();
  final _apiClient = ApiClient();

  UserSession? _session;
  bool _loading = true;

  late final AuthService _authService = AuthService(_apiClient);
  late final DoctorService _doctorService = DoctorService(_apiClient);
  late final PatientService _patientService = PatientService(_apiClient);

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final restored = await _authStorage.restore();
    if (!mounted) {
      return;
    }
    setState(() {
      _session = restored;
      _loading = false;
    });
  }

  Future<void> _onLoggedIn(UserSession session) async {
    await _authStorage.save(session);
    if (!mounted) {
      return;
    }
    setState(() {
      _session = session;
    });
  }

  Future<void> _logout() async {
    await _authStorage.clear();
    if (!mounted) {
      return;
    }
    setState(() {
      _session = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Farishtaa',
      theme: AppTheme.light(),
      home: _loading
          ? const _AppLoadingScreen()
          : (_session == null
                ? AuthScreen(authService: _authService, onLoggedIn: _onLoggedIn)
                : RootShell(
                    session: _session!,
                    doctorService: _doctorService,
                    patientService: _patientService,
                    onLogout: _logout,
                  )),
    );
  }
}

class _AppLoadingScreen extends StatelessWidget {
  const _AppLoadingScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
