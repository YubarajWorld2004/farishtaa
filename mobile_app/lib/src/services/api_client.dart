import 'dart:async';
import 'dart:convert';
import 'dart:io';

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
  static const Duration _requestTimeout = Duration(seconds: 25);

  Uri _uri(String path) {
    final normalizedBase = AppConfig.baseUrl.replaceFirst(RegExp(r'/+$'), '');
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  Future<Map<String, dynamic>> get(String path, {String? token}) async {
    final response = await _withTimeout(
      _client.get(_uri(path), headers: _headers(token: token)),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> post(
    String path, {
    Object? body,
    String? token,
  }) async {
    final response = await _withTimeout(
      _client.post(
        _uri(path),
        headers: _headers(token: token),
        body: jsonEncode(body ?? {}),
      ),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Object? body,
    String? token,
  }) async {
    final response = await _withTimeout(
      _client.patch(
        _uri(path),
        headers: _headers(token: token),
        body: jsonEncode(body ?? {}),
      ),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Object? body,
    String? token,
  }) async {
    final response = await _withTimeout(
      _client.put(
        _uri(path),
        headers: _headers(token: token),
        body: jsonEncode(body ?? {}),
      ),
    );
    return _decode(response);
  }

  Future<Map<String, dynamic>> postMultipart(
    String path, {
    Map<String, String>? fields,
    List<File>? files,
    String fileField = 'files',
    String? token,
  }) async {
    final request = http.MultipartRequest('POST', _uri(path));
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }

    if (fields != null) {
      request.fields.addAll(fields);
    }

    if (files != null && files.isNotEmpty) {
      for (final file in files) {
        request.files.add(
          await http.MultipartFile.fromPath(fileField, file.path),
        );
      }
    }

    final streamed = await _withTimeout(request.send());
    final response = await _withTimeout(http.Response.fromStream(streamed));
    return _decode(response);
  }

  Future<Map<String, dynamic>> delete(String path, {String? token}) async {
    final response = await _withTimeout(
      _client.delete(_uri(path), headers: _headers(token: token)),
    );
    return _decode(response);
  }

  Future<T> _withTimeout<T>(Future<T> action) async {
    try {
      return await action.timeout(_requestTimeout);
    } on TimeoutException {
      throw const ApiException(
        'Request timed out. Please check your connection and try again.',
      );
    }
  }

  Map<String, String> _headers({String? token}) {
    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  Map<String, dynamic> _decode(http.Response response) {
    final payload = _safeJsonDecode(response.body);
    final data = payload is Map<String, dynamic>
        ? payload
        : <String, dynamic>{'data': payload};

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    final errorMessages = data['errorMessages'];
    final message =
        data['message']?.toString() ??
        data['error']?.toString() ??
        (errorMessages is List && errorMessages.isNotEmpty
            ? errorMessages.first.toString()
            : 'Request failed with status ${response.statusCode}');

    throw ApiException(message, statusCode: response.statusCode);
  }

  dynamic _safeJsonDecode(String body) {
    if (body.isEmpty) {
      return <String, dynamic>{};
    }
    try {
      return jsonDecode(body);
    } catch (_) {
      return <String, dynamic>{'message': body};
    }
  }
}
