DateTime? _toDate(dynamic value) {
  if (value == null) {
    return null;
  }
  return DateTime.tryParse(value.toString());
}

String _personName(Map<String, dynamic>? json, {String fallback = ''}) {
  if (json == null) {
    return fallback;
  }

  final full = (json['name'] ?? '').toString().trim();
  if (full.isNotEmpty) {
    return full;
  }

  final first = (json['firstName'] ?? '').toString().trim();
  final last = (json['lastName'] ?? '').toString().trim();
  final combined = '$first $last'.trim();
  return combined.isEmpty ? fallback : combined;
}

class PrescriptionMedicineModel {
  const PrescriptionMedicineModel({
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.duration,
    required this.instructions,
  });

  final String name;
  final String dosage;
  final String frequency;
  final String duration;
  final String instructions;

  factory PrescriptionMedicineModel.fromJson(Map<String, dynamic> json) {
    return PrescriptionMedicineModel(
      name: (json['name'] ?? '').toString(),
      dosage: (json['dosage'] ?? '').toString(),
      frequency: (json['frequency'] ?? '').toString(),
      duration: (json['duration'] ?? '').toString(),
      instructions: (json['instructions'] ?? '').toString(),
    );
  }
}

class PrescriptionFileModel {
  const PrescriptionFileModel({
    required this.fileName,
    required this.fileUrl,
    required this.mimeType,
    required this.size,
  });

  final String fileName;
  final String fileUrl;
  final String mimeType;
  final int size;

  factory PrescriptionFileModel.fromJson(Map<String, dynamic> json) {
    return PrescriptionFileModel(
      fileName: (json['fileName'] ?? '').toString(),
      fileUrl: (json['fileUrl'] ?? '').toString(),
      mimeType: (json['mimeType'] ?? '').toString(),
      size: int.tryParse((json['size'] ?? '').toString()) ?? 0,
    );
  }
}

class PrescriptionModel {
  const PrescriptionModel({
    required this.id,
    required this.doctorName,
    required this.patientName,
    required this.patientAge,
    required this.patientGender,
    required this.doctorSpecialist,
    required this.clinicName,
    required this.diagnosis,
    required this.notes,
    required this.medicines,
    required this.file,
    required this.issuedAt,
    required this.appointmentDate,
    required this.appointmentSlot,
    required this.appointmentStatus,
  });

  final String id;
  final String doctorName;
  final String patientName;
  final int? patientAge;
  final String patientGender;
  final String doctorSpecialist;
  final String clinicName;
  final String diagnosis;
  final String notes;
  final List<PrescriptionMedicineModel> medicines;
  final PrescriptionFileModel? file;
  final DateTime? issuedAt;
  final String appointmentDate;
  final String appointmentSlot;
  final String appointmentStatus;

  factory PrescriptionModel.fromJson(Map<String, dynamic> json) {
    final doctorRaw = json['doctor'] is Map<String, dynamic>
        ? json['doctor'] as Map<String, dynamic>
        : null;
    final appointmentRaw = json['appointment'] is Map<String, dynamic>
        ? json['appointment'] as Map<String, dynamic>
        : null;
    final patientRaw = json['patient'] is Map<String, dynamic>
        ? json['patient'] as Map<String, dynamic>
        : null;

    final medicinesRaw = json['medicines'];
    final fileRaw = json['file'];

    return PrescriptionModel(
      id: (json['_id'] ?? '').toString(),
      doctorName: _personName(doctorRaw, fallback: 'Doctor'),
      patientName: _personName(patientRaw, fallback: 'Patient'),
      patientAge: int.tryParse((patientRaw?['age'] ?? '').toString()),
      patientGender: (patientRaw?['gender'] ?? '').toString(),
      doctorSpecialist: (doctorRaw?['specialist'] ?? '').toString(),
      clinicName: (doctorRaw?['clinicName'] ?? '').toString(),
      diagnosis: (json['diagnosis'] ?? '').toString(),
      notes: (json['notes'] ?? '').toString(),
      medicines: medicinesRaw is List
          ? medicinesRaw
                .whereType<Map<String, dynamic>>()
                .map(PrescriptionMedicineModel.fromJson)
                .toList()
          : <PrescriptionMedicineModel>[],
      file: fileRaw is Map<String, dynamic>
          ? PrescriptionFileModel.fromJson(fileRaw)
          : null,
      issuedAt: _toDate(json['issuedAt']),
      appointmentDate: (appointmentRaw?['appointmentDate'] ?? '').toString(),
      appointmentSlot: (appointmentRaw?['slotTime'] ?? '').toString(),
      appointmentStatus: (appointmentRaw?['status'] ?? '').toString(),
    );
  }
}
