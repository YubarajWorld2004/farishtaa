class AppConfig {
  const AppConfig._();

  // Default backend; can still be overridden with --dart-define=API_BASE_URL.
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://farishtaa-backend.vercel.app',
  );

  static const double defaultLat = 20.2961;
  static const double defaultLng = 85.8245;
}
