import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'i18n/app_locale_controller.dart';
import 'i18n/app_localizations.dart';
import 'models/auth_models.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/root_shell.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/auth_storage.dart';
import 'services/doctor_dashboard_service.dart';
import 'services/doctor_service.dart';
import 'services/hospital_dashboard_service.dart';
import 'services/patient_service.dart';
import 'theme/app_theme.dart';
import 'theme/app_theme_controller.dart';

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
  final _localeController = AppLocaleController();
  final _themeController = AppThemeController();

  UserSession? _session;
  bool _sessionReady = false;
  bool _localeReady = false;
  bool _themeReady = false;

  late final AuthService _authService = AuthService(_apiClient);
  late final DoctorService _doctorService = DoctorService(_apiClient);
  late final DoctorDashboardService _doctorDashboardService =
      DoctorDashboardService(_apiClient);
  late final HospitalDashboardService _hospitalDashboardService =
      HospitalDashboardService(_apiClient);
  late final PatientService _patientService = PatientService(_apiClient);

  @override
  void initState() {
    super.initState();
    _restoreSession();
    _restoreLocale();
    _restoreTheme();
  }

  @override
  void dispose() {
    _localeController.dispose();
    _themeController.dispose();
    super.dispose();
  }

  Future<void> _restoreSession() async {
    final restored = await _authStorage.restore();
    if (!mounted) {
      return;
    }
    setState(() {
      _session = restored;
      _sessionReady = true;
    });
  }

  Future<void> _restoreLocale() async {
    await _localeController.restore();
    if (!mounted) {
      return;
    }
    setState(() {
      _localeReady = true;
    });
  }

  Future<void> _restoreTheme() async {
    await _themeController.restore();
    if (!mounted) {
      return;
    }
    setState(() {
      _themeReady = true;
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
    final loading = !_sessionReady || !_localeReady || !_themeReady;

    return AnimatedBuilder(
      animation: Listenable.merge([_localeController, _themeController]),
      builder: (context, _) => MaterialApp(
        debugShowCheckedModeBanner: false,
        onGenerateTitle: (context) => context.l10n.t('app.title'),
        theme: AppTheme.light(),
        darkTheme: AppTheme.dark(),
        themeMode: _themeController.themeMode,
        locale: _localeController.locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: const [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: loading
            ? const _AppLoadingScreen()
            : (_session == null
                  ? AuthScreen(
                      authService: _authService,
                      onLoggedIn: _onLoggedIn,
                      localeController: _localeController,
                      themeController: _themeController,
                    )
                  : RootShell(
                      session: _session!,
                      doctorService: _doctorService,
                      doctorDashboardService: _doctorDashboardService,
                      hospitalDashboardService: _hospitalDashboardService,
                      patientService: _patientService,
                      onLogout: _logout,
                      localeController: _localeController,
                      themeController: _themeController,
                    )),
      ),
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
