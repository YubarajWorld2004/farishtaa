import '../models/hospital_dashboard_models.dart';
import 'api_client.dart';

class HospitalDashboardService {
  HospitalDashboardService(this._apiClient);

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

  Future<HospitalProfileModel> getProfile({required String token}) async {
    final response = await _apiClient.get(
      '/api/hospital-dashboard/profile',
      token: token,
    );
    return HospitalProfileModel.fromJson(response);
  }

  Future<HospitalProfileModel> updateProfile({
    required String token,
    required Map<String, dynamic> payload,
  }) async {
    final response = await _apiClient.put(
      '/api/hospital-dashboard/profile',
      token: token,
      body: payload,
    );
    return HospitalProfileModel.fromJson(response);
  }

  Future<HospitalStatsModel> getStats({required String token}) async {
    final response = await _apiClient.get(
      '/api/hospital-dashboard/stats',
      token: token,
    );
    return HospitalStatsModel.fromJson(response);
  }

  Future<List<HospitalDoctorModel>> getDoctors({
    required String token,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.get(
      _withPagination('/api/hospital-dashboard/doctors', page: page, limit: limit),
      token: token,
    );

    final doctorsRaw = response['doctors'];
    if (doctorsRaw is! List) {
      return <HospitalDoctorModel>[];
    }

    return doctorsRaw
        .whereType<Map<String, dynamic>>()
        .map(HospitalDoctorModel.fromJson)
        .toList();
  }

  Future<HospitalDoctorModel> addDoctor({
    required String token,
    required Map<String, dynamic> payload,
  }) async {
    final response = await _apiClient.post(
      '/api/hospital-dashboard/doctors',
      token: token,
      body: payload,
    );

    final doctorRaw = response['doctor'];
    if (doctorRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid doctor response');
    }

    return HospitalDoctorModel.fromJson(doctorRaw);
  }

  Future<void> removeDoctor({
    required String token,
    required String doctorId,
  }) async {
    final encoded = Uri.encodeComponent(doctorId);
    await _apiClient.delete(
      '/api/hospital-dashboard/doctors/$encoded',
      token: token,
    );
  }

  Future<HospitalDoctorModel> getDoctorDetail({
    required String token,
    required String doctorId,
  }) async {
    final encoded = Uri.encodeComponent(doctorId);
    final response = await _apiClient.get(
      '/api/hospital-dashboard/doctors/$encoded',
      token: token,
    );

    final doctorRaw = response['doctor'];
    if (doctorRaw is! Map<String, dynamic>) {
      throw const ApiException('Invalid doctor detail response');
    }

    return HospitalDoctorModel.fromJson(doctorRaw);
  }

  Future<List<HospitalDoctorReview>> getDoctorReviews({
    required String token,
    required String doctorId,
    int page = 1,
    int limit = 50,
  }) async {
    final encoded = Uri.encodeComponent(doctorId);
    final response = await _apiClient.get(
      _withPagination(
        '/api/hospital-dashboard/doctors/$encoded/reviews',
        page: page,
        limit: limit,
      ),
      token: token,
    );

    final reviewsRaw = response['reviews'];
    if (reviewsRaw is! List) {
      return <HospitalDoctorReview>[];
    }

    return reviewsRaw
        .whereType<Map<String, dynamic>>()
        .map(HospitalDoctorReview.fromJson)
        .toList();
  }
}
