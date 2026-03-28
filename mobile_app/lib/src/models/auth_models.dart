class UserSession {
  const UserSession({
    required this.token,
    required this.userType,
    required this.userId,
    required this.firstName,
  });

  final String token;
  final String userType;
  final String userId;
  final String firstName;

  factory UserSession.fromJson(Map<String, dynamic> json) {
    return UserSession(
      token: (json['token'] ?? '').toString(),
      userType: (json['userType'] ?? '').toString(),
      userId: (json['userId'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
    );
  }

  Map<String, String> toMap() {
    return {
      'token': token,
      'userType': userType,
      'userId': userId,
      'firstName': firstName,
    };
  }

  factory UserSession.fromMap(Map<String, String> map) {
    return UserSession(
      token: map['token'] ?? '',
      userType: map['userType'] ?? '',
      userId: map['userId'] ?? '',
      firstName: map['firstName'] ?? '',
    );
  }
}
