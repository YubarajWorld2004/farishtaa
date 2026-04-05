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

class TelemedicineSessionModel {
  const TelemedicineSessionModel({
    required this.id,
    required this.status,
    required this.lastMessageAt,
    required this.updatedAt,
    required this.appointmentStatus,
    required this.appointmentDate,
    required this.appointmentSlot,
    required this.doctorId,
    required this.doctorName,
    required this.doctorSpecialist,
    required this.doctorPhotoUrl,
    required this.patientId,
    required this.patientName,
  });

  final String id;
  final String status;
  final DateTime? lastMessageAt;
  final DateTime? updatedAt;
  final String appointmentStatus;
  final String appointmentDate;
  final String appointmentSlot;
  final String doctorId;
  final String doctorName;
  final String doctorSpecialist;
  final String doctorPhotoUrl;
  final String patientId;
  final String patientName;

  bool get isBlockedForPatient =>
      status == 'closed' ||
      appointmentStatus == 'rejected' ||
      appointmentStatus == 'completed' ||
      appointmentStatus == 'cancelled' ||
      appointmentStatus == 'closed';

  factory TelemedicineSessionModel.fromJson(Map<String, dynamic> json) {
    final doctorRaw = json['doctor'] is Map<String, dynamic>
        ? json['doctor'] as Map<String, dynamic>
        : null;
    final patientRaw = json['patient'] is Map<String, dynamic>
        ? json['patient'] as Map<String, dynamic>
        : null;
    final appointmentRaw = json['appointment'] is Map<String, dynamic>
        ? json['appointment'] as Map<String, dynamic>
        : null;

    return TelemedicineSessionModel(
      id: (json['_id'] ?? '').toString(),
      status: (json['status'] ?? 'active').toString(),
      lastMessageAt: _toDate(json['lastMessageAt']),
      updatedAt: _toDate(json['updatedAt']),
      appointmentStatus: (appointmentRaw?['status'] ?? '').toString(),
      appointmentDate: (appointmentRaw?['appointmentDate'] ?? '').toString(),
      appointmentSlot: (appointmentRaw?['slotTime'] ?? '').toString(),
      doctorId: (doctorRaw?['_id'] ?? '').toString(),
      doctorName: _personName(doctorRaw, fallback: 'Doctor'),
      doctorSpecialist: (doctorRaw?['specialist'] ?? '').toString(),
      doctorPhotoUrl: (doctorRaw?['photoUrl'] ?? '').toString(),
      patientId: (patientRaw?['_id'] ?? '').toString(),
      patientName: _personName(patientRaw, fallback: 'Patient'),
    );
  }
}

class TelemedicineAttachmentModel {
  const TelemedicineAttachmentModel({
    required this.fileName,
    required this.fileUrl,
    required this.mimeType,
    required this.size,
  });

  final String fileName;
  final String fileUrl;
  final String mimeType;
  final int size;

  factory TelemedicineAttachmentModel.fromJson(Map<String, dynamic> json) {
    return TelemedicineAttachmentModel(
      fileName: (json['fileName'] ?? '').toString(),
      fileUrl: (json['fileUrl'] ?? '').toString(),
      mimeType: (json['mimeType'] ?? '').toString(),
      size: int.tryParse((json['size'] ?? '').toString()) ?? 0,
    );
  }
}

class TelemedicineMessageModel {
  const TelemedicineMessageModel({
    required this.id,
    required this.senderType,
    required this.senderName,
    required this.content,
    required this.attachments,
    required this.createdAt,
  });

  final String id;
  final String senderType;
  final String senderName;
  final String content;
  final List<TelemedicineAttachmentModel> attachments;
  final DateTime? createdAt;

  factory TelemedicineMessageModel.fromJson(Map<String, dynamic> json) {
    final senderRaw = json['sender'] is Map<String, dynamic>
        ? json['sender'] as Map<String, dynamic>
        : null;
    final attachmentsRaw = json['attachments'];

    return TelemedicineMessageModel(
      id: (json['_id'] ?? '').toString(),
      senderType: (json['senderType'] ?? '').toString(),
      senderName: _personName(
        senderRaw,
        fallback: (json['senderType'] ?? 'User').toString(),
      ),
      content: (json['content'] ?? '').toString(),
      attachments: attachmentsRaw is List
          ? attachmentsRaw
                .whereType<Map<String, dynamic>>()
                .map(TelemedicineAttachmentModel.fromJson)
                .toList()
          : <TelemedicineAttachmentModel>[],
      createdAt: _toDate(json['createdAt']),
    );
  }
}
