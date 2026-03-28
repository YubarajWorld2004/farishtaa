import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Request location permission and get current device location
  /// Returns [lat, lng] or throws exception if permission denied
  Future<({double lat, double lng})> getCurrentLocation() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Check if location services are enabled
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled.');
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    // Get current position
    final position = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );

    return (lat: position.latitude, lng: position.longitude);
  }

  /// Get last known location (faster, less accurate)
  Future<({double lat, double lng})?> getLastKnownLocation() async {
    try {
      final position = await Geolocator.getLastKnownPosition();
      if (position != null) {
        return (lat: position.latitude, lng: position.longitude);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
