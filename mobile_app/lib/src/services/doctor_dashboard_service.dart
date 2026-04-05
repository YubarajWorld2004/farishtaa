import 'dart:convert';
import 'dart:io';

import '../models/appointment_models.dart';
import '../models/doctor_dashboard_models.dart';
import '../models/notification_models.dart';
import '../models/prescription_models.dart';
import '../models/telemedicine_models.dart';
import 'api_client.dart';

class DoctorDashboardService {
  DoctorDashboardService(this._apiClient);

  final ApiClient _apiClient;

  Future<DoctorDashboardProfile> getProfile({required String token}) async {
    final response = await _apiClient.get(
      '/api/doctor-dashboard/profile',
      token: token,
    );
    return DoctorDashboardProfile.fromJson(response);
  }

  Future<DoctorDashboardProfile> updateProfile({
    required String token,
    required Map<String, dynamic> payload,
  }) async {
    final response = await _apiClient.put(
      '/api/doctor-dashboard/profile',
      token: token,
      body: payload,
    );
    return DoctorDashboardProfile.fromJson(response);
  }

  Future<DoctorDashboardStats> getStats({required String token}) async {
    final response = await _apiClient.get(
      '/api/doctor-dashboard/stats',
      token: token,
    );
    return DoctorDashboardStats.fromJson(response);
  }

  Future<List<DoctorDashboardReview>> getReviews({
    required String token,
  }) async {
    final response = await _apiClient.get(
      '/api/doctor-dashboard/reviews',
      token: token,
    );

    final reviewsRaw = response['reviews'];
    if (reviewsRaw is! List) {
      return <DoctorDashboardReview>[];
    }

    return reviewsRaw
        .whereType<Map<String, dynamic>>()
        .map(DoctorDashboardReview.fromJson)
        .toList();
  }

  Future<List<AppointmentModel>> getAppointments({
    required String token,
    String? status,
  }) async {
    String path = '/api/doctor-dashboard/appointments';
    if (status != null && status.isNotEmpty) {
      final encoded = Uri.encodeQueryComponent(status);
      path = '$path?status=$encoded';
    }

    final response = await _apiClient.get(path, token: token);
    final appointmentsRaw = response['appointments'];

    if (appointmentsRaw is! List) {
      return <AppointmentModel>[];
    }

    return appointmentsRaw
        .whereType<Map<String, dynamic>>()
        .map(AppointmentModel.fromJson)
        .toList();
  }

  Future<AppointmentModel> updateAppointmentStatus({
    required String token,
    required String appointmentId,
    required String status,
    String? doctorResponseNote,
  }) async {
    final encoded = Uri.encodeComponent(appointmentId);

    final payload = <String, dynamic>{'status': status};
    if (doctorResponseNote != null) {
      payload['doctorResponseNote'] = doctorResponseNote;
    }

    final response = await _apiClient.patch(
      '/api/doctor-dashboard/appointments/$encoded/status',
      token: token,
      body: payload,
    );

    final appointmentRaw = response['appointment'];
    if (appointmentRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid appointment status update response');
    }

    return AppointmentModel.fromJson(appointmentRaw);
  }

  Future<List<TelemedicineSessionModel>> getTelemedicineSessions({
    required String token,
  }) async {
    final response = await _apiClient.get(
      '/api/doctor-dashboard/telemedicine/sessions',
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
  }) async {
    final encoded = Uri.encodeComponent(sessionId);
    final response = await _apiClient.get(
      '/api/doctor-dashboard/telemedicine/sessions/$encoded/messages',
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
      '/api/doctor-dashboard/telemedicine/sessions/$encoded/messages',
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
  }) async {
    final response = await _apiClient.get(
      '/api/doctor-dashboard/prescriptions',
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

  Future<PrescriptionModel> createPrescription({
    required String token,
    required String patientId,
    String appointmentId = '',
    String diagnosis = '',
    String notes = '',
    List<Map<String, String>> medicines = const <Map<String, String>>[],
    File? file,
  }) async {
    final fields = <String, String>{
      'patientId': patientId,
      'diagnosis': diagnosis,
      'notes': notes,
      'medicines': jsonEncode(medicines),
    };

    if (appointmentId.isNotEmpty) {
      fields['appointmentId'] = appointmentId;
    }

    final response = await _apiClient.postMultipart(
      '/api/doctor-dashboard/prescriptions',
      token: token,
      fields: fields,
      files: file == null ? const <File>[] : <File>[file],
      fileField: 'file',
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
      '/api/doctor-dashboard/notifications?$query',
      token: token,
    );

    return _parseNotificationListResponse(response);
  }

  Future<NotificationListResponse> markAllNotificationsRead({
    required String token,
  }) async {
    final response = await _apiClient.patch(
      '/api/doctor-dashboard/notifications/read-all',
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
      '/api/doctor-dashboard/notifications/$encoded/read',
      token: token,
    );

    return _parseNotificationListResponse(response);
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
}
