import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppThemeController extends ChangeNotifier {
  static const String _prefKey = 'isDarkMode';

  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    final isDark = prefs.getBool(_prefKey);
    if (isDark == null) {
      return;
    }

    final nextMode = isDark ? ThemeMode.dark : ThemeMode.light;
    if (nextMode == _themeMode) {
      return;
    }

    _themeMode = nextMode;
    notifyListeners();
  }

  Future<void> setDarkMode(bool enabled) async {
    final nextMode = enabled ? ThemeMode.dark : ThemeMode.light;
    if (nextMode == _themeMode) {
      return;
    }

    _themeMode = nextMode;
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, enabled);
  }

  Future<void> toggle() => setDarkMode(!isDarkMode);
}
