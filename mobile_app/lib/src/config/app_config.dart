class AppConfig {
  const AppConfig._();

  static const String _definedBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  // `--dart-define=API_BASE_URL=...` always wins.
  // Default points to deployed backend for all build modes.
  static String get baseUrl {
    final configured = _definedBaseUrl.trim();
    if (configured.isNotEmpty) {
      return configured;
    }

    return 'https://farishtaa-backend.vercel.app';
  }

  static const double defaultLat = 20.2961;
  static const double defaultLng = 85.8245;
}
