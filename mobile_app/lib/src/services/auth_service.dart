import '../models/auth_models.dart';
import 'api_client.dart';

class AuthService {
  AuthService(this._apiClient);

  final ApiClient _apiClient;

  Future<void> signup({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String userType,
    required int age,
    required String gender,
  }) async {
    await _apiClient.post(
      '/api/auth/signup',
      body: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'userType': userType,
        'age': age,
        'gender': gender,
      },
    );
  }

  Future<UserSession> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/api/auth/login',
      body: {'email': email, 'password': password},
    );
    return UserSession.fromJson(response);
  }
}
