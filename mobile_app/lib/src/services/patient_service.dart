import 'dart:io';

import '../models/appointment_models.dart';
import '../models/chat_models.dart';
import '../models/notification_models.dart';
import '../models/prescription_models.dart';
import '../models/telemedicine_models.dart';
import 'api_client.dart';

class PatientService {
  PatientService(this._apiClient);

  final ApiClient _apiClient;

  String _withPagination(
    String path, {
    required int page,
    required int limit,
  }) {
    final safePage = page < 1 ? 1 : page;
    final safeLimit = limit < 1 ? 1 : limit;
    final query = Uri(queryParameters: <String, String>{
      'page': '$safePage',
      'limit': '$safeLimit',
    }).query;

    if (path.contains('?')) {
      return '$path&$query';
    }
    return '$path?$query';
  }

  String _resolveSymptomLanguage(String language) {
    final normalized = language.trim().toLowerCase();
    switch (normalized) {
      case 'en':
      case 'english':
        return 'English';
      case 'hi':
      case 'hindi':
        return 'Hindi';
      case 'or':
      case 'od':
      case 'odia':
      case 'oriya':
        return 'Odia';
      default:
        return normalized.isEmpty ? 'English' : language.trim();
    }
  }

  List<ChatMessageModel> _localSymptomFallback({
    required String prompt,
    required String language,
  }) {
    final now = DateTime.now();
    final normalized = language.trim().toLowerCase();

    String content;
    if (normalized == 'hindi' || normalized == 'hi') {
      content =
          'Farishtaa AI abhi temporary unavailable hai. Kripya apne symptoms dobara bhejein ya doctor se turant sampark karein. Agar severe chest pain, breathing difficulty, fainting, heavy bleeding, ya high fever ho to emergency care lein.';
    } else if (normalized == 'odia' ||
        normalized == 'oriya' ||
        normalized == 'or' ||
        normalized == 'od') {
      content =
          'Farishtaa AI temporary unavailable achhi. Dayakari punithare symptoms pathantu ba turanta daktaranku contact karantu. Jadi severe chest pain, breathing difficulty, fainting, heavy bleeding, ba high fever achhi, turanta emergency care neantu.';
    } else {
      content =
          'Farishtaa AI is temporarily unavailable. Please try sending your symptoms again or contact a doctor directly. If you have severe chest pain, breathing difficulty, fainting, heavy bleeding, or high fever, seek emergency care immediately.';
    }

    return <ChatMessageModel>[
      ChatMessageModel(
        id: 'local-user-${now.microsecondsSinceEpoch}',
        role: 'patient',
        content: prompt,
        createdAt: now,
      ),
      ChatMessageModel(
        id: 'local-assistant-${now.microsecondsSinceEpoch + 1}',
        role: 'assistant',
        content: content,
        createdAt: now,
      ),
    ];
  }

  Future<List<ChatSessionModel>> getSessions({
    required String userId,
    required String token,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      _withPagination('/api/patient/sessions/$userId', page: page, limit: limit),
      token: token,
    );

    final sessionsRaw = response['sessions'];
    if (sessionsRaw is! List) {
      return <ChatSessionModel>[];
    }

    return sessionsRaw
        .whereType<Map<String, dynamic>>()
        .map(ChatSessionModel.fromJson)
        .toList();
  }

  Future<List<String>> getDoctorAvailableSlots({
    required String doctorId,
    required String date,
    required String token,
  }) async {
    final encodedDoctorId = Uri.encodeComponent(doctorId);
    final encodedDate = Uri.encodeQueryComponent(date);
    final response = await _apiClient.get(
      '/api/patient/appointments/doctor/$encodedDoctorId/slots?date=$encodedDate',
      token: token,
    );

    final slotsRaw = response['availableSlots'];
    if (slotsRaw is! List) {
      return <String>[];
    }
    return slotsRaw
        .map((e) => e.toString())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Future<AppointmentPaymentOrder> createAppointmentPaymentOrder({
    required String token,
    required String doctorId,
    required String appointmentDate,
    required String slotTime,
  }) async {
    final response = await _apiClient.post(
      '/api/patient/appointments/payment/order',
      token: token,
      body: {
        'doctorId': doctorId,
        'appointmentDate': appointmentDate,
        'slotTime': slotTime,
      },
    );
    return AppointmentPaymentOrder.fromJson(response);
  }

  Future<AppointmentModel> bookAppointment({
    required String token,
    required String doctorId,
    required String appointmentDate,
    required String slotTime,
    required String meetingType,
    required String appointmentFor,
    String reason = '',
    String relativeName = '',
    int? relativeAge,
    String relativeRelation = '',
    String relativeImportantThings = '',
  }) async {
    final payload = <String, dynamic>{
      'doctorId': doctorId,
      'appointmentDate': appointmentDate,
      'slotTime': slotTime,
      'reason': reason,
      'meetingType': meetingType,
      'appointmentFor': appointmentFor,
    };

    if (appointmentFor == 'relative') {
      payload['relativeName'] = relativeName;
      payload['relativeAge'] = relativeAge;
      payload['relativeRelation'] = relativeRelation;
      payload['relativeImportantThings'] = relativeImportantThings;
    }

    final response = await _apiClient.post(
      '/api/patient/appointments/book',
      token: token,
      body: payload,
    );

    final appointmentRaw = response['appointment'];
    if (appointmentRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid appointment response');
    }
    return AppointmentModel.fromJson(appointmentRaw);
  }

  Future<AppointmentModel> verifyAppointmentPaymentAndBook({
    required String token,
    required String doctorId,
    required String appointmentDate,
    required String slotTime,
    required String meetingType,
    required String appointmentFor,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    String reason = '',
    String relativeName = '',
    int? relativeAge,
    String relativeRelation = '',
    String relativeImportantThings = '',
  }) async {
    final payload = <String, dynamic>{
      'doctorId': doctorId,
      'appointmentDate': appointmentDate,
      'slotTime': slotTime,
      'reason': reason,
      'meetingType': meetingType,
      'appointmentFor': appointmentFor,
      'razorpayOrderId': razorpayOrderId,
      'razorpayPaymentId': razorpayPaymentId,
      'razorpaySignature': razorpaySignature,
    };

    if (appointmentFor == 'relative') {
      payload['relativeName'] = relativeName;
      payload['relativeAge'] = relativeAge;
      payload['relativeRelation'] = relativeRelation;
      payload['relativeImportantThings'] = relativeImportantThings;
    }

    final response = await _apiClient.post(
      '/api/patient/appointments/payment/verify-and-book',
      token: token,
      body: payload,
    );

    final appointmentRaw = response['appointment'];
    if (appointmentRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid appointment response');
    }
    return AppointmentModel.fromJson(appointmentRaw);
  }

  Future<List<AppointmentModel>> getAppointments({
    required String token,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      _withPagination('/api/patient/appointments', page: page, limit: limit),
      token: token,
    );
    final appointmentsRaw = response['appointments'];
    if (appointmentsRaw is! List) {
      return <AppointmentModel>[];
    }
    return appointmentsRaw
        .whereType<Map<String, dynamic>>()
        .map(AppointmentModel.fromJson)
        .toList();
  }

  Future<AppointmentModel> cancelAppointment({
    required String token,
    required String appointmentId,
  }) async {
    final encoded = Uri.encodeComponent(appointmentId);
    final response = await _apiClient.patch(
      '/api/patient/appointments/$encoded/cancel',
      token: token,
    );

    final appointmentRaw = response['appointment'];
    if (appointmentRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid cancel appointment response');
    }
    return AppointmentModel.fromJson(appointmentRaw);
  }

  Future<List<TelemedicineSessionModel>> getTelemedicineSessions({
    required String token,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      _withPagination('/api/patient/telemedicine/sessions', page: page, limit: limit),
      token: token,
    );

    final sessionsRaw = response['sessions'];
    if (sessionsRaw is! List) {
      return <TelemedicineSessionModel>[];
    }
    return sessionsRaw
        .whereType<Map<String, dynamic>>()
        .map(TelemedicineSessionModel.fromJson)
        .toList();
  }

  Future<List<TelemedicineMessageModel>> getTelemedicineMessages({
    required String token,
    required String sessionId,
    int page = 1,
    int limit = 200,
  }) async {
    final encoded = Uri.encodeComponent(sessionId);
    final response = await _apiClient.get(
      _withPagination(
        '/api/patient/telemedicine/sessions/$encoded/messages',
        page: page,
        limit: limit,
      ),
      token: token,
    );

    final messagesRaw = response['messages'];
    if (messagesRaw is! List) {
      return <TelemedicineMessageModel>[];
    }
    return messagesRaw
        .whereType<Map<String, dynamic>>()
        .map(TelemedicineMessageModel.fromJson)
        .toList();
  }

  Future<TelemedicineMessageModel> sendTelemedicineMessage({
    required String token,
    required String sessionId,
    required String content,
    List<File> files = const <File>[],
  }) async {
    final encoded = Uri.encodeComponent(sessionId);
    final response = await _apiClient.postMultipart(
      '/api/patient/telemedicine/sessions/$encoded/messages',
      token: token,
      fields: <String, String>{'content': content},
      files: files,
      fileField: 'files',
    );

    final messageRaw = response['message'];
    if (messageRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid telemedicine message response');
    }
    return TelemedicineMessageModel.fromJson(messageRaw);
  }

  Future<List<PrescriptionModel>> getPrescriptions({
    required String token,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      _withPagination('/api/patient/prescriptions', page: page, limit: limit),
      token: token,
    );
    final prescriptionsRaw = response['prescriptions'];
    if (prescriptionsRaw is! List) {
      return <PrescriptionModel>[];
    }
    return prescriptionsRaw
        .whereType<Map<String, dynamic>>()
        .map(PrescriptionModel.fromJson)
        .toList();
  }

  Future<PrescriptionModel> getPrescriptionById({
    required String token,
    required String prescriptionId,
  }) async {
    final encoded = Uri.encodeComponent(prescriptionId);
    final response = await _apiClient.get(
      '/api/patient/prescriptions/$encoded',
      token: token,
    );

    final prescriptionRaw = response['prescription'];
    if (prescriptionRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid prescription response');
    }
    return PrescriptionModel.fromJson(prescriptionRaw);
  }

  Future<NotificationListResponse> getNotifications({
    required String token,
    int limit = 20,
    bool unreadOnly = false,
    DateTime? after,
  }) async {
    final params = <String, String>{'limit': '$limit'};
    if (unreadOnly) {
      params['unreadOnly'] = 'true';
    }
    if (after != null) {
      params['after'] = after.toUtc().toIso8601String();
    }

    final query = Uri(queryParameters: params).query;
    final response = await _apiClient.get(
      '/api/patient/notifications?$query',
      token: token,
    );
    return _parseNotificationListResponse(response);
  }

  Future<NotificationListResponse> markAllNotificationsRead({
    required String token,
  }) async {
    final response = await _apiClient.patch(
      '/api/patient/notifications/read-all',
      token: token,
    );

    return _parseNotificationListResponse(response);
  }

  Future<NotificationListResponse> markNotificationRead({
    required String token,
    required String notificationId,
  }) async {
    final encoded = Uri.encodeComponent(notificationId);
    final response = await _apiClient.patch(
      '/api/patient/notifications/$encoded/read',
      token: token,
    );
    return _parseNotificationListResponse(response);
  }

  Future<NotificationMutationResult> deleteNotification({
    required String token,
    required String notificationId,
  }) async {
    final encoded = Uri.encodeComponent(notificationId);
    final response = await _apiClient.delete(
      '/api/patient/notifications/$encoded',
      token: token,
    );

    return _parseNotificationMutationResult(response);
  }

  Future<NotificationMutationResult> deleteAllNotifications({
    required String token,
  }) async {
    final response = await _apiClient.delete(
      '/api/patient/notifications',
      token: token,
    );

    return _parseNotificationMutationResult(response);
  }

  Future<ChatSessionModel> createSession({
    required String userId,
    required String token,
  }) async {
    final response = await _apiClient.post(
      '/api/patient/sessions/$userId',
      token: token,
    );
    final session = response['session'];
    if (session is! Map<String, dynamic>) {
      throw const ApiException('Invalid session response');
    }
    return ChatSessionModel.fromJson(session);
  }

  Future<void> deleteSession({
    required String userId,
    required String sessionId,
    required String token,
  }) async {
    await _apiClient.delete(
      '/api/patient/sessions/$userId/$sessionId',
      token: token,
    );
  }

  Future<List<ChatMessageModel>> getChats({
    required String userId,
    required String sessionId,
    required String token,
    int page = 1,
    int limit = 200,
  }) async {
    final response = await _apiClient.get(
      _withPagination(
        '/api/patient/symptoms/$userId/$sessionId',
        page: page,
        limit: limit,
      ),
      token: token,
    );

    final chatsRaw = response['chats'];
    if (chatsRaw is! List) {
      return <ChatMessageModel>[];
    }

    return chatsRaw
        .whereType<Map<String, dynamic>>()
        .map(ChatMessageModel.fromJson)
        .toList();
  }

  Future<List<ChatMessageModel>> sendPrompt({
    required String userId,
    required String sessionId,
    required String token,
    required String prompt,
    required String language,
  }) async {
    final trimmedPrompt = prompt.trim();
    final resolvedLanguage = _resolveSymptomLanguage(language);

    Map<String, dynamic> response;
    try {
      response = await _apiClient.post(
        '/api/patient/symptoms/$userId/$sessionId',
        token: token,
        body: {'userPrompt': trimmedPrompt, 'language': resolvedLanguage},
      );
    } on ApiException catch (error) {
      final shouldRetry =
          (error.statusCode ?? 0) >= 500 && trimmedPrompt.isNotEmpty;
      if (!shouldRetry) {
        rethrow;
      }

      try {
        response = await _apiClient.post(
          '/api/patient/symptoms/$userId/$sessionId',
          token: token,
          body: {'userPrompt': trimmedPrompt, 'language': 'English'},
        );
      } on ApiException catch (retryError) {
        if ((retryError.statusCode ?? 0) >= 500) {
          return _localSymptomFallback(
            prompt: trimmedPrompt,
            language: resolvedLanguage,
          );
        }
        rethrow;
      }
    }

    final chatsRaw = response['chats'];
    if (chatsRaw is! List) {
      return _localSymptomFallback(
        prompt: trimmedPrompt,
        language: resolvedLanguage,
      );
    }

    return chatsRaw
        .whereType<Map<String, dynamic>>()
        .map(ChatMessageModel.fromJson)
        .toList();
  }

  NotificationListResponse _parseNotificationListResponse(
    Map<String, dynamic> response,
  ) {
    final notificationsRaw = response['notifications'];
    final notifications = notificationsRaw is List
        ? notificationsRaw
              .whereType<Map<String, dynamic>>()
              .map(AppNotificationModel.fromJson)
              .toList()
        : <AppNotificationModel>[];

    final unreadRaw = response['unreadCount'];
    final unreadCount = unreadRaw is int
        ? unreadRaw
        : int.tryParse(unreadRaw?.toString() ?? '') ?? 0;

    return NotificationListResponse(
      notifications: notifications,
      unreadCount: unreadCount,
    );
  }

  NotificationMutationResult _parseNotificationMutationResult(
    Map<String, dynamic> response,
  ) {
    final unreadRaw = response['unreadCount'];
    final unreadCount = unreadRaw is int
        ? unreadRaw
        : int.tryParse(unreadRaw?.toString() ?? '') ?? 0;

    final affectedRaw =
        response['deletedCount'] ?? response['updatedCount'] ?? response['affectedCount'];
    var affectedCount = affectedRaw is int
        ? affectedRaw
        : int.tryParse(affectedRaw?.toString() ?? '') ?? 0;

    if (affectedCount == 0 && (response['deletedId'] ?? '').toString().isNotEmpty) {
      affectedCount = 1;
    }

    return NotificationMutationResult(
      unreadCount: unreadCount,
      affectedCount: affectedCount,
    );
  }
}
