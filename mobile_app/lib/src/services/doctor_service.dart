import '../config/app_config.dart';
import '../models/doctor.dart';
import 'api_client.dart';

class DoctorService {
  DoctorService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<String>> getCategories() async {
    final response = await _apiClient.get('/api/doctor/categories');
    final categoriesRaw = response['categories'];
    if (categoriesRaw is! List) {
      return <String>[];
    }
    return categoriesRaw
        .map((e) => e.toString())
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Future<List<DoctorListItem>> searchNearbyByCategory({
    required String category,
    double lat = AppConfig.defaultLat,
    double lng = AppConfig.defaultLng,
    double radius = 15000,
  }) async {
    final encodedCategory = Uri.encodeComponent(category);
    final response = await _apiClient.post(
      '/api/doctor/nearby-search/$encodedCategory',
      body: {'lat': lat, 'lng': lng, 'radius': radius},
    );

    final data = response['data'];
    if (data is! List) {
      return <DoctorListItem>[];
    }

    return data
        .whereType<Map<String, dynamic>>()
        .map(DoctorListItem.fromJson)
        .toList();
  }
}
