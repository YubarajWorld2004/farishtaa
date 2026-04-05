double _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
}

DateTime? _toDate(dynamic value) {
  if (value == null) {
    return null;
  }
  return DateTime.tryParse(value.toString());
}

String _nameFromParts(Map<String, dynamic> raw) {
  final full = (raw['name'] ?? '').toString().trim();
  if (full.isNotEmpty) {
    return full;
  }
  final first = (raw['firstName'] ?? '').toString().trim();
  final last = (raw['lastName'] ?? '').toString().trim();
  final joined = '$first $last'.trim();
  return joined.isEmpty ? 'Unknown Doctor' : joined;
}

String _stringAddress(dynamic value) {
  if (value is String) {
    return value.trim();
  }
  if (value is! Map<String, dynamic>) {
    return '';
  }

  final lines = <String>[
    (value['street'] ?? '').toString().trim(),
    (value['district'] ?? '').toString().trim(),
    (value['state'] ?? '').toString().trim(),
    (value['postcode'] ?? '').toString().trim(),
  ].where((part) => part.isNotEmpty).toList();

  return lines.join(', ');
}

class DoctorAvailabilitySlot {
  const DoctorAvailabilitySlot({
    required this.day,
    required this.startTime,
    required this.endTime,
  });

  final String day;
  final String startTime;
  final String endTime;

  factory DoctorAvailabilitySlot.fromJson(Map<String, dynamic> json) {
    return DoctorAvailabilitySlot(
      day: (json['day'] ?? '').toString(),
      startTime: (json['startTime'] ?? '').toString(),
      endTime: (json['endTime'] ?? '').toString(),
    );
  }
}

class DoctorReview {
  const DoctorReview({
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

  factory DoctorReview.fromJson(Map<String, dynamic> json) {
    final patientRaw = json['patientId'];
    String patientName = 'Anonymous';
    if (patientRaw is Map<String, dynamic>) {
      final first = (patientRaw['firstName'] ?? '').toString().trim();
      final last = (patientRaw['lastName'] ?? '').toString().trim();
      final resolved = '$first $last'.trim();
      if (resolved.isNotEmpty) {
        patientName = resolved;
      }
    }

    return DoctorReview(
      id: (json['_id'] ?? '').toString(),
      rating: _toDouble(json['rating']),
      review: (json['review'] ?? '').toString(),
      createdAt: _toDate(json['createdAt']),
      patientName: patientName,
    );
  }
}

class DoctorListItem {
  const DoctorListItem({
    required this.id,
    required this.name,
    required this.speciality,
    required this.experience,
    required this.photoUrl,
    required this.distanceKm,
    required this.rating,
    required this.reviewCount,
    required this.tags,
    required this.address,
    required this.about,
    required this.languages,
    required this.latitude,
    required this.longitude,
    required this.mapLink,
    required this.fee,
    required this.clinicName,
    required this.canBookAppointment,
    required this.isUserDoctor,
    required this.availability,
    required this.reviews,
  });

  final String id;
  final String name;
  final String speciality;
  final String experience;
  final String photoUrl;
  final double? distanceKm;
  final double rating;
  final int reviewCount;
  final List<String> tags;
  final String address;
  final String about;
  final List<String> languages;
  final double? latitude;
  final double? longitude;
  final String mapLink;
  final double fee;
  final String clinicName;
  final bool canBookAppointment;
  final bool isUserDoctor;
  final List<DoctorAvailabilitySlot> availability;
  final List<DoctorReview> reviews;

  bool get isNearby => (distanceKm ?? 999) <= 5;
  bool get supportsOnlineBooking =>
      canBookAppointment || isUserDoctor || availability.isNotEmpty;

  factory DoctorListItem.fromJson(Map<String, dynamic> json) {
    final dynamic reviewsRaw = json['reviews'];
    final List<dynamic> rawReviewList = reviewsRaw is List
        ? reviewsRaw
        : <dynamic>[];
    final List<String> specialistsRaw = json['specialists'] is List
        ? (json['specialists'] as List)
              .map((e) => e.toString().trim())
              .where((e) => e.isNotEmpty)
              .toList()
        : <String>[];

    final String specialist =
        (json['specialist'] ??
                (specialistsRaw.isNotEmpty
                    ? specialistsRaw.first
                    : 'General Physician'))
            .toString();

    final dynamic distanceRaw = json['distance'];
    final double? distanceKm = distanceRaw == null
        ? null
        : _toDouble(distanceRaw) / 1000;

    double rating = _toDouble(json['rating']);
    if (rating == 0 && rawReviewList.isNotEmpty) {
      final reviewRatings = rawReviewList
          .map(
            (e) => _toDouble((e is Map<String, dynamic>) ? e['rating'] : null),
          )
          .where((value) => value > 0)
          .toList();
      if (reviewRatings.isNotEmpty) {
        final total = reviewRatings.reduce((a, b) => a + b);
        rating = total / reviewRatings.length;
      }
    }

    final List<String> tags = <String>[];
    if (specialist.isNotEmpty) {
      tags.add(specialist);
    }
    final degree = (json['degree'] ?? '').toString();
    if (degree.isNotEmpty) {
      tags.add(degree);
    }
    if ((json['type'] ?? '').toString().toLowerCase().contains('hospital')) {
      tags.add('Hospital');
    }
    for (final item in specialistsRaw.take(3)) {
      if (!tags.contains(item)) {
        tags.add(item);
      }
    }

    final dynamic langsRaw = json['languages'];
    final List<String> languages = langsRaw is List
        ? langsRaw.map((e) => e.toString()).where((e) => e.isNotEmpty).toList()
        : <String>[];

    final dynamic locationRaw = json['location'];
    double? latitude;
    double? longitude;
    if (locationRaw is Map<String, dynamic>) {
      final dynamic coordsRaw = locationRaw['coordinates'];
      if (coordsRaw is List && coordsRaw.length >= 2) {
        longitude = _toDouble(coordsRaw[0]);
        latitude = _toDouble(coordsRaw[1]);
      }
    }

    final availabilityRaw = json['availability'];
    final availability = availabilityRaw is List
        ? availabilityRaw
              .whereType<Map<String, dynamic>>()
              .map(DoctorAvailabilitySlot.fromJson)
              .where(
                (slot) =>
                    slot.day.isNotEmpty ||
                    slot.startTime.isNotEmpty ||
                    slot.endTime.isNotEmpty,
              )
              .toList()
        : <DoctorAvailabilitySlot>[];

    final reviews =
        (reviewsRaw is List
                ? reviewsRaw.whereType<Map<String, dynamic>>()
                : <Map<String, dynamic>>[])
            .map(DoctorReview.fromJson)
            .toList();

    final canBookRaw = json['canBookAppointment'];
    final canBookAppointment = canBookRaw is bool
        ? canBookRaw
        : (canBookRaw?.toString().toLowerCase() == 'true');

    final isUserDoctorRaw = json['_isUserDoctor'];
    final isUserDoctor = isUserDoctorRaw is bool
        ? isUserDoctorRaw
        : (isUserDoctorRaw?.toString().toLowerCase() == 'true');

    return DoctorListItem(
      id: (json['_id'] ?? '').toString(),
      name: _nameFromParts(json),
      speciality: specialist,
      experience: (json['experience'] ?? '0').toString(),
      photoUrl: (json['photoUrl'] ?? '').toString(),
      distanceKm: distanceKm,
      rating: rating,
      reviewCount: reviews.length,
      tags: tags.take(3).toList(),
      address: _stringAddress(json['address']),
      about: (json['about'] ?? '').toString(),
      languages: languages,
      latitude: latitude,
      longitude: longitude,
      mapLink: (json['mapLink'] ?? '').toString(),
      fee: _toDouble(json['fee']),
      clinicName: (json['clinicName'] ?? '').toString(),
      canBookAppointment: canBookAppointment,
      isUserDoctor: isUserDoctor,
      availability: availability,
      reviews: reviews,
    );
  }
}
