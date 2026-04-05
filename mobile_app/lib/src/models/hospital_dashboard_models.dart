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

String _fullName(Map<String, dynamic>? json, {String fallback = ''}) {
  if (json == null) {
    return fallback;
  }

  final first = (json['firstName'] ?? '').toString().trim();
  final last = (json['lastName'] ?? '').toString().trim();
  final value = '$first $last'.trim();
  return value.isEmpty ? fallback : value;
}

class HospitalStatsModel {
  const HospitalStatsModel({
    required this.totalDoctors,
    required this.completedProfiles,
    required this.totalReviews,
    required this.averageRating,
  });

  final int totalDoctors;
  final int completedProfiles;
  final int totalReviews;
  final double averageRating;

  factory HospitalStatsModel.fromJson(Map<String, dynamic> json) {
    final source = json['stats'] is Map<String, dynamic>
        ? json['stats'] as Map<String, dynamic>
        : json;

    return HospitalStatsModel(
      totalDoctors: _toInt(source['totalDoctors']),
      completedProfiles: _toInt(source['completedProfiles']),
      totalReviews: _toInt(source['totalReviews']),
      averageRating: _toDouble(source['averageRating']),
    );
  }
}

class HospitalDoctorAvailability {
  const HospitalDoctorAvailability({
    required this.day,
    required this.startTime,
    required this.endTime,
  });

  final String day;
  final String startTime;
  final String endTime;

  factory HospitalDoctorAvailability.fromJson(Map<String, dynamic> json) {
    return HospitalDoctorAvailability(
      day: (json['day'] ?? '').toString(),
      startTime: (json['startTime'] ?? '').toString(),
      endTime: (json['endTime'] ?? '').toString(),
    );
  }

  Map<String, String> toJson() {
    return {'day': day, 'startTime': startTime, 'endTime': endTime};
  }
}

class HospitalDoctorReview {
  const HospitalDoctorReview({
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

  factory HospitalDoctorReview.fromJson(Map<String, dynamic> json) {
    final patientRaw = json['patientId'] as Map<String, dynamic>?;

    return HospitalDoctorReview(
      id: (json['_id'] ?? '').toString(),
      rating: _toDouble(json['rating']),
      review: (json['review'] ?? '').toString(),
      createdAt: _toDate(json['createdAt']),
      patientName: _fullName(patientRaw, fallback: 'Patient'),
    );
  }
}

class HospitalDoctorModel {
  const HospitalDoctorModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
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
    required this.profileCompleted,
    required this.availability,
    required this.reviews,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String email;
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
  final bool profileCompleted;
  final List<HospitalDoctorAvailability> availability;
  final List<HospitalDoctorReview> reviews;

  String get fullName {
    final value = '$firstName $lastName'.trim();
    return value.isEmpty ? 'Doctor' : value;
  }

  double get averageRating {
    if (reviews.isEmpty) {
      return 0;
    }
    final sum = reviews.fold<double>(0, (acc, item) => acc + item.rating);
    return sum / reviews.length;
  }

  factory HospitalDoctorModel.fromJson(Map<String, dynamic> json) {
    final languagesRaw = json['languages'];
    final languages = languagesRaw is List
        ? languagesRaw
              .map((item) => item.toString())
              .where((item) => item.isNotEmpty)
              .toList()
        : <String>[];

    final availabilityRaw = json['availability'];
    final availability = availabilityRaw is List
        ? availabilityRaw
              .whereType<Map<String, dynamic>>()
              .map(HospitalDoctorAvailability.fromJson)
              .toList()
        : <HospitalDoctorAvailability>[];

    final reviewsRaw = json['doctorReviews'] ?? json['reviews'];
    final reviews = reviewsRaw is List
        ? reviewsRaw
              .whereType<Map<String, dynamic>>()
              .map(HospitalDoctorReview.fromJson)
              .toList()
        : <HospitalDoctorReview>[];

    return HospitalDoctorModel(
      id: (json['_id'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      specialist: (json['specialist'] ?? '').toString(),
      experience: _toInt(json['experience']),
      degree: (json['degree'] ?? '').toString(),
      languages: languages,
      about: (json['about'] ?? '').toString(),
      address: (json['address'] ?? '').toString(),
      photoUrl: (json['photoUrl'] ?? '').toString(),
      mapLink: (json['mapLink'] ?? '').toString(),
      fee: _toDouble(json['fee']),
      clinicName: (json['clinicName'] ?? '').toString(),
      profileCompleted: json['profileCompleted'] == true,
      availability: availability,
      reviews: reviews,
    );
  }
}

class HospitalProfileModel {
  const HospitalProfileModel({
    required this.id,
    required this.firstName,
    required this.hospitalName,
    required this.hospitalAddress,
    required this.hospitalPhone,
    required this.hospitalAbout,
    required this.profileCompleted,
    required this.doctors,
  });

  final String id;
  final String firstName;
  final String hospitalName;
  final String hospitalAddress;
  final String hospitalPhone;
  final String hospitalAbout;
  final bool profileCompleted;
  final List<HospitalDoctorModel> doctors;

  String get displayName {
    if (hospitalName.trim().isNotEmpty) {
      return hospitalName.trim();
    }
    return firstName.trim().isEmpty ? 'Hospital' : firstName.trim();
  }

  factory HospitalProfileModel.fromJson(Map<String, dynamic> json) {
    final source = json['hospital'] is Map<String, dynamic>
        ? json['hospital'] as Map<String, dynamic>
        : json;

    final doctorsRaw = source['doctors'];
    final doctors = doctorsRaw is List
        ? doctorsRaw
              .whereType<Map<String, dynamic>>()
              .map(HospitalDoctorModel.fromJson)
              .toList()
        : <HospitalDoctorModel>[];

    return HospitalProfileModel(
      id: (source['_id'] ?? '').toString(),
      firstName: (source['firstName'] ?? '').toString(),
      hospitalName: (source['hospitalName'] ?? '').toString(),
      hospitalAddress: (source['hospitalAddress'] ?? '').toString(),
      hospitalPhone: (source['hospitalPhone'] ?? '').toString(),
      hospitalAbout: (source['hospitalAbout'] ?? '').toString(),
      profileCompleted: source['profileCompleted'] == true,
      doctors: doctors,
    );
  }
}
