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

String _joinName(Map<String, dynamic> json) {
  final full = (json['name'] ?? '').toString().trim();
  if (full.isNotEmpty) {
    return full;
  }
  final first = (json['firstName'] ?? '').toString().trim();
  final last = (json['lastName'] ?? '').toString().trim();
  final resolved = '$first $last'.trim();
  return resolved;
}

class AppointmentRelativeDetails {
  const AppointmentRelativeDetails({
    required this.name,
    required this.age,
    required this.relation,
    required this.importantNotes,
  });

  final String name;
  final int? age;
  final String relation;
  final String importantNotes;

  factory AppointmentRelativeDetails.fromJson(Map<String, dynamic> json) {
    final parsedAge = int.tryParse((json['age'] ?? '').toString());
    return AppointmentRelativeDetails(
      name: (json['name'] ?? '').toString(),
      age: parsedAge,
      relation: (json['relation'] ?? '').toString(),
      importantNotes: (json['importantNotes'] ?? '').toString(),
    );
  }
}

class AppointmentDoctor {
  const AppointmentDoctor({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.name,
    required this.specialist,
    required this.fee,
    required this.clinicName,
    required this.photoUrl,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String name;
  final double fee;
  final String specialist;
  final String clinicName;
  final String photoUrl;

  String get displayName {
    if (name.isNotEmpty) {
      return name;
    }
    final combined = '$firstName $lastName'.trim();
    return combined.isEmpty ? 'Doctor' : combined;
  }

  factory AppointmentDoctor.fromJson(Map<String, dynamic> json) {
    return AppointmentDoctor(
      id: (json['_id'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      name: _joinName(json),
      specialist: (json['specialist'] ?? '').toString(),
      fee: _toDouble(json['fee']),
      clinicName: (json['clinicName'] ?? '').toString(),
      photoUrl: (json['photoUrl'] ?? '').toString(),
    );
  }
}

class AppointmentPatient {
  const AppointmentPatient({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.age,
    required this.gender,
  });

  final String id;
  final String firstName;
  final String lastName;
  final int? age;
  final String gender;

  String get displayName {
    final combined = '$firstName $lastName'.trim();
    return combined.isEmpty ? 'Patient' : combined;
  }

  factory AppointmentPatient.fromJson(Map<String, dynamic> json) {
    return AppointmentPatient(
      id: (json['_id'] ?? '').toString(),
      firstName: (json['firstName'] ?? '').toString(),
      lastName: (json['lastName'] ?? '').toString(),
      age: int.tryParse((json['age'] ?? '').toString()),
      gender: (json['gender'] ?? '').toString(),
    );
  }
}

class AppointmentPaymentOrder {
  const AppointmentPaymentOrder({
    required this.keyId,
    required this.orderId,
    required this.amount,
    required this.currency,
    required this.doctorFee,
  });

  final String keyId;
  final String orderId;
  final int amount;
  final String currency;
  final double doctorFee;

  factory AppointmentPaymentOrder.fromJson(Map<String, dynamic> json) {
    return AppointmentPaymentOrder(
      keyId: (json['keyId'] ?? '').toString(),
      orderId: (json['orderId'] ?? '').toString(),
      amount: int.tryParse((json['amount'] ?? '').toString()) ?? 0,
      currency: (json['currency'] ?? 'INR').toString(),
      doctorFee: _toDouble(json['doctorFee']),
    );
  }
}

class AppointmentModel {
  const AppointmentModel({
    required this.id,
    required this.doctor,
    required this.patient,
    required this.appointmentDate,
    required this.slotTime,
    required this.appointmentAt,
    required this.status,
    required this.reason,
    required this.meetingType,
    required this.appointmentFor,
    required this.relativeDetails,
    required this.doctorResponseNote,
    required this.telemedicineSession,
    required this.paymentRequired,
    required this.paymentStatus,
    required this.paymentProvider,
    required this.paymentOrderId,
    required this.paymentId,
    required this.paymentAmount,
    required this.paymentCurrency,
    required this.paidAt,
  });

  final String id;
  final AppointmentDoctor doctor;
  final AppointmentPatient patient;
  final String appointmentDate;
  final String slotTime;
  final DateTime? appointmentAt;
  final String status;
  final String reason;
  final String meetingType;
  final String appointmentFor;
  final AppointmentRelativeDetails? relativeDetails;
  final String doctorResponseNote;
  final String telemedicineSession;
  final bool paymentRequired;
  final String paymentStatus;
  final String paymentProvider;
  final String paymentOrderId;
  final String paymentId;
  final double paymentAmount;
  final String paymentCurrency;
  final DateTime? paidAt;

  bool get canCancel => status == 'pending' || status == 'accepted';
  bool get canOpenTelemedicine =>
      status == 'accepted' && telemedicineSession.isNotEmpty;
  bool get isRelativeBooking => appointmentFor == 'relative';

  String get resolvedPaymentStatus {
    if (paymentStatus.isNotEmpty) {
      return paymentStatus;
    }
    return paymentRequired ? 'pending' : 'not_required';
  }

  double get billedAmountRupees {
    if (paymentAmount > 0) {
      return paymentAmount / 100;
    }
    return doctor.fee;
  }

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    final doctorRaw = json['doctor'];
    final doctor = doctorRaw is Map<String, dynamic>
        ? AppointmentDoctor.fromJson(doctorRaw)
        : const AppointmentDoctor(
            id: '',
            firstName: '',
            lastName: '',
            name: 'Doctor',
            specialist: '',
            fee: 0,
            clinicName: '',
            photoUrl: '',
          );

    final patientRaw = json['patient'];
    final patient = patientRaw is Map<String, dynamic>
        ? AppointmentPatient.fromJson(patientRaw)
        : const AppointmentPatient(
            id: '',
            firstName: '',
            lastName: '',
            age: null,
            gender: '',
          );

    final relativeRaw = json['relativeDetails'];

    return AppointmentModel(
      id: (json['_id'] ?? '').toString(),
      doctor: doctor,
      patient: patient,
      appointmentDate: (json['appointmentDate'] ?? '').toString(),
      slotTime: (json['slotTime'] ?? '').toString(),
      appointmentAt: _toDate(json['appointmentAt']),
      status: (json['status'] ?? 'pending').toString(),
      reason: (json['reason'] ?? '').toString(),
      meetingType: (json['meetingType'] ?? 'online').toString(),
      appointmentFor: (json['appointmentFor'] ?? 'self').toString(),
      relativeDetails: relativeRaw is Map<String, dynamic>
          ? AppointmentRelativeDetails.fromJson(relativeRaw)
          : null,
      doctorResponseNote: (json['doctorResponseNote'] ?? '').toString(),
      telemedicineSession: (json['telemedicineSession'] ?? '').toString(),
      paymentRequired: json['paymentRequired'] == true,
      paymentStatus: (json['paymentStatus'] ?? '').toString(),
      paymentProvider: (json['paymentProvider'] ?? '').toString(),
      paymentOrderId: (json['paymentOrderId'] ?? '').toString(),
      paymentId: (json['paymentId'] ?? '').toString(),
      paymentAmount: _toDouble(json['paymentAmount']),
      paymentCurrency: (json['paymentCurrency'] ?? 'INR').toString(),
      paidAt: _toDate(json['paidAt']),
    );
  }
}
