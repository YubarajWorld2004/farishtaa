DateTime? _safeDate(dynamic value) {
  if (value == null) {
    return null;
  }
  return DateTime.tryParse(value.toString());
}

class ChatSessionModel {
  const ChatSessionModel({
    required this.id,
    required this.title,
    required this.updatedAt,
  });

  final String id;
  final String title;
  final DateTime? updatedAt;

  factory ChatSessionModel.fromJson(Map<String, dynamic> json) {
    return ChatSessionModel(
      id: (json['_id'] ?? '').toString(),
      title: (json['title'] ?? 'New Chat').toString(),
      updatedAt: _safeDate(json['updatedAt']),
    );
  }
}

class ChatMessageModel {
  const ChatMessageModel({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final String role;
  final String content;
  final DateTime? createdAt;

  bool get isUser => role.toLowerCase() == 'patient';

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: (json['_id'] ?? '').toString(),
      role: (json['role'] ?? 'assistant').toString(),
      content: (json['content'] ?? '').toString(),
      createdAt: _safeDate(json['createdAt']),
    );
  }
}
