import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_models.dart';

class AuthStorage {
  static const _tokenKey = 'token';
  static const _userTypeKey = 'userType';
  static const _userIdKey = 'userId';
  static const _firstNameKey = 'firstName';

  Future<void> save(UserSession session) async {
    final prefs = await SharedPreferences.getInstance();
    final data = session.toMap();
    await prefs.setString(_tokenKey, data['token'] ?? '');
    await prefs.setString(_userTypeKey, data['userType'] ?? '');
    await prefs.setString(_userIdKey, data['userId'] ?? '');
    await prefs.setString(_firstNameKey, data['firstName'] ?? '');
  }

  Future<UserSession?> restore() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey) ?? '';
    if (token.isEmpty) {
      return null;
    }

    return UserSession.fromMap({
      'token': token,
      'userType': prefs.getString(_userTypeKey) ?? '',
      'userId': prefs.getString(_userIdKey) ?? '',
      'firstName': prefs.getString(_firstNameKey) ?? '',
    });
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userTypeKey);
    await prefs.remove(_userIdKey);
    await prefs.remove(_firstNameKey);
  }
}
