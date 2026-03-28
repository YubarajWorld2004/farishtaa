import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String path) {
    final normalizedBase = AppConfig.baseUrl.replaceFirst(RegExp(r'/+$'), '');
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  Future<Map<String, dynamic>> get(String path, {String? token}) async {
    final response = await _client.get(
      _uri(path),
      headers: _headers(token: token),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Object? body,
    String? token,
  }) async {
    final response = await _client.post(
      _uri(path),
      headers: _headers(token: token),
      body: jsonEncode(body ?? {}),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> delete(String path, {String? token}) async {
    final response = await _client.delete(
      _uri(path),
      headers: _headers(token: token),
    );
    return _decode(response);
  }

  Map<String, String> _headers({String? token}) {
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Map<String, dynamic> _decode(http.Response response) {
    final payload = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body);
    final data = payload is Map<String, dynamic>
        ? payload
        : <String, dynamic>{'data': payload};

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    final errorMessages = data['errorMessages'];
    final message =
        data['message']?.toString() ??
        (errorMessages is List && errorMessages.isNotEmpty
            ? errorMessages.first.toString()
            : 'Request failed with status ${response.statusCode}');

    throw ApiException(message, statusCode: response.statusCode);
  }
}
