double _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value?.toString() ?? '') ?? 0;
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

  bool get isNearby => (distanceKm ?? 999) <= 5;

  factory DoctorListItem.fromJson(Map<String, dynamic> json) {
    final dynamic reviewsRaw = json['reviews'];
    final List<dynamic> reviews = reviewsRaw is List ? reviewsRaw : <dynamic>[];
    final String specialist =
        (json['specialist'] ??
                ((json['specialists'] is List &&
                        (json['specialists'] as List).isNotEmpty)
                    ? (json['specialists'] as List).first
                    : 'General Physician'))
            .toString();

    final dynamic distanceRaw = json['distance'];
    final double? distanceKm = distanceRaw == null
        ? null
        : _toDouble(distanceRaw) / 1000;

    double rating = _toDouble(json['rating']);
    if (rating == 0 && reviews.isNotEmpty) {
      final reviewRatings = reviews
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

    return DoctorListItem(
      id: (json['_id'] ?? '').toString(),
      name: (json['name'] ?? 'Unknown Doctor').toString(),
      speciality: specialist,
      experience: (json['experience'] ?? '0').toString(),
      photoUrl: (json['photoUrl'] ?? '').toString(),
      distanceKm: distanceKm,
      rating: rating,
      reviewCount: reviews.length,
      tags: tags.take(3).toList(),
      address: (json['address'] ?? '').toString(),
      about: (json['about'] ?? '').toString(),
      languages: languages,
      latitude: latitude,
      longitude: longitude,
    );
  }
}
