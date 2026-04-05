DateTime? _toDate(dynamic value) {
  if (value == null) {
    return null;
  }
  return DateTime.tryParse(value.toString());
}

double _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _toInt(dynamic value) {
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

class DoctorDashboardStats {
  const DoctorDashboardStats({
    required this.totalReviews,
    required this.averageRating,
  });

  final int totalReviews;
  final double averageRating;

  factory DoctorDashboardStats.fromJson(Map<String, dynamic> json) {
    final statsRaw = json['stats'];
    final source = statsRaw is Map<String, dynamic>
        ? statsRaw
        : <String, dynamic>{};

    return DoctorDashboardStats(
      totalReviews: _toInt(source['totalReviews']),
      averageRating: _toDouble(source['averageRating']),
    );
  }
}

class DoctorDashboardAvailability {
  const DoctorDashboardAvailability({
    required this.day,
    required this.startTime,
    required this.endTime,
  });

  final String day;
  final String startTime;
  final String endTime;

  factory DoctorDashboardAvailability.fromJson(Map<String, dynamic> json) {
    return DoctorDashboardAvailability(
      day: (json['day'] ?? '').toString(),
      startTime: (json['startTime'] ?? '').toString(),
      endTime: (json['endTime'] ?? '').toString(),
    );
  }

  Map<String, String> toJson() {
    return {'day': day, 'startTime': startTime, 'endTime': endTime};
  }
}

class DoctorDashboardReview {
  const DoctorDashboardReview({
    required this.id,
    required this.rating,
    required this.review,
    required this.createdAt,
    required this.patientName,
  });

  final String id;
  final double rating;
  final String review;
  final DateTime? createdAt;
  final String patientName;

  factory DoctorDashboardReview.fromJson(Map<String, dynamic> json) {
    final patientRaw = json['patientId'];
    String patientName = 'Patient';
    if (patientRaw is Map<String, dynamic>) {
      final first = (patientRaw['firstName'] ?? '').toString().trim();
      final last = (patientRaw['lastName'] ?? '').toString().trim();
      final resolved = '$first $last'.trim();
      if (resolved.isNotEmpty) {
        patientName = resolved;
      }
    }

    return DoctorDashboardReview(
      id: (json['_id'] ?? '').toString(),
      rating: _toDouble(json['rating']),
      review: (json['review'] ?? '').toString(),
      createdAt: _toDate(json['createdAt']),
      patientName: patientName,
    );
  }
}

class DoctorDashboardProfile {
  const DoctorDashboardProfile({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.specialist,
    required this.experience,
    required this.degree,
    required this.languages,
    required this.about,
    required this.address,
    required this.photoUrl,
    required this.mapLink,
    required this.fee,
    required this.clinicName,
    required this.latitude,
    required this.longitude,
    required this.profileCompleted,
    required this.isHospitalManaged,
    required this.availability,
    required this.reviews,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String specialist;
  final int experience;
  final String degree;
  final List<String> languages;
  final String about;
  final String address;
  final String photoUrl;
  final String mapLink;
  final double fee;
  final String clinicName;
  final double? latitude;
  final double? longitude;
  final bool profileCompleted;
  final bool isHospitalManaged;
  final List<DoctorDashboardAvailability> availability;
  final List<DoctorDashboardReview> reviews;

  String get fullName {
    final combined = '$firstName $lastName'.trim();
    return combined.isEmpty ? 'Doctor' : combined;
  }

  factory DoctorDashboardProfile.fromJson(Map<String, dynamic> json) {
    final profileRaw = json['doctor'];
    final source = profileRaw is Map<String, dynamic>
        ? profileRaw
        : <String, dynamic>{};

    final locationRaw = source['location'];
    double? latitude;
    double? longitude;
    if (locationRaw is Map<String, dynamic>) {
      final coordsRaw = locationRaw['coordinates'];
      if (coordsRaw is List && coordsRaw.length >= 2) {
        longitude = _toDouble(coordsRaw[0]);
        latitude = _toDouble(coordsRaw[1]);
      }
    }

    final langsRaw = source['languages'];
    final languages = langsRaw is List
        ? langsRaw
              .map((item) => item.toString())
              .where((e) => e.isNotEmpty)
              .toList()
        : <String>[];

    final availabilityRaw = source['availability'];
    final availability = availabilityRaw is List
        ? availabilityRaw
              .whereType<Map<String, dynamic>>()
              .map(DoctorDashboardAvailability.fromJson)
              .toList()
        : <DoctorDashboardAvailability>[];

    final reviewsRaw = source['doctorReviews'];
    final reviews = reviewsRaw is List
        ? reviewsRaw
              .whereType<Map<String, dynamic>>()
              .map(DoctorDashboardReview.fromJson)
              .toList()
        : <DoctorDashboardReview>[];

    return DoctorDashboardProfile(
      id: (source['_id'] ?? '').toString(),
      firstName: (source['firstName'] ?? '').toString(),
      lastName: (source['lastName'] ?? '').toString(),
      specialist: (source['specialist'] ?? '').toString(),
      experience: _toInt(source['experience']),
      degree: (source['degree'] ?? '').toString(),
      languages: languages,
      about: (source['about'] ?? '').toString(),
      address: (source['address'] ?? '').toString(),
      photoUrl: (source['photoUrl'] ?? '').toString(),
      mapLink: (source['mapLink'] ?? '').toString(),
      fee: _toDouble(source['fee']),
      clinicName: (source['clinicName'] ?? '').toString(),
      latitude: latitude,
      longitude: longitude,
      profileCompleted: source['profileCompleted'] == true,
      isHospitalManaged: source['addedByHospital'] != null,
      availability: availability,
      reviews: reviews,
    );
  }
}
