import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppLocaleController extends ChangeNotifier {
  static const String _storageKey = 'app_locale_code';

  Locale _locale = const Locale('en');

  Locale get locale => _locale;

  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_storageKey) ?? 'en';
    _locale = Locale(_normalizeCode(code));
    notifyListeners();
  }

  Future<void> setLocaleByCode(String code) async {
    final normalized = _normalizeCode(code);
    if (_locale.languageCode == normalized) {
      return;
    }
    _locale = Locale(normalized);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, normalized);
    notifyListeners();
  }

  String _normalizeCode(String value) {
    switch (value) {
      case 'hi':
      case 'or':
      case 'en':
        return value;
      default:
        return 'en';
    }
  }
}
