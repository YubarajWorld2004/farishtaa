import '../models/chat_models.dart';
import 'api_client.dart';

class PatientService {
  PatientService(this._apiClient);

  final ApiClient _apiClient;

  Future<List<ChatSessionModel>> getSessions({
    required String userId,
    required String token,
  }) async {
    final response = await _apiClient.get(
      '/api/patient/sessions/$userId',
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
  }) async {
    final response = await _apiClient.get(
      '/api/patient/symptoms/$userId/$sessionId',
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
    final response = await _apiClient.post(
      '/api/patient/symptoms/$userId/$sessionId',
      token: token,
      body: {'userPrompt': prompt, 'language': language},
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
}
