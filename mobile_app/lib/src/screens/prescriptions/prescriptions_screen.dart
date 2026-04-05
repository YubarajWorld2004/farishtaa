import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_config.dart';
import '../../models/auth_models.dart';
import '../../models/prescription_models.dart';
import '../../services/patient_service.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({
    super.key,
    required this.session,
    required this.patientService,
  });

  final UserSession session;
  final PatientService patientService;

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  static const String _farishtaaLogoWithNameSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="100" viewBox="0 0 360 100" fill="none">
  <g fill="none" stroke="#E50914" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(0 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(51.42857142857143 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(102.85714285714286 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(154.28571428571428 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(205.71428571428572 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(257.14285714285717 50 50)" />
    <path d="M50 20 C60 25, 70 40, 50 55 C30 40, 40 25, 50 20" transform="rotate(308.57142857142856 50 50)" />
    <circle cx="50" cy="50" r="6" stroke="#E50914" />
  </g>
  <text
    x="94"
    y="63"
    fill="#E50914"
    font-family="Arial, Helvetica, sans-serif"
    font-size="44"
    font-weight="700"
  >Farishtaa</text>
</svg>
''';

  static const String _signatureTickSvg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M5 10.5L8.5 14L15 7.5" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
''';

  static const List<String> _watermarkLabels = <String>[
    'Farishtaa',
    'Farishtaa',
  ];

  List<PrescriptionModel> _prescriptions = <PrescriptionModel>[];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    if (_canUsePatientPrescriptions) {
      _fetch();
    }
  }

  bool get _canUsePatientPrescriptions =>
      widget.session.userType.toLowerCase() == 'patient';

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final prescriptions = await widget.patientService.getPrescriptions(
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _prescriptions = prescriptions);
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  String _toAbsolute(String value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }

    final base = AppConfig.baseUrl.replaceFirst(RegExp(r'/$'), '');
    final path = value.startsWith('/') ? value : '/$value';
    return '$base$path';
  }

  String _safeFileNamePart(String value) {
    final cleaned = value.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    if (cleaned.isEmpty) {
      return 'record';
    }
    return cleaned;
  }

  String _pdfValue(String? value, {String fallback = 'N/A'}) {
    final text = (value ?? '').trim();
    return text.isEmpty ? fallback : text;
  }

  String _formatPdfDateTime(DateTime value) {
    return DateFormat('d/M/yyyy, h:mm:ss a').format(value).toLowerCase();
  }

  pw.Widget _buildPdfSectionTitle(String title) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(top: 10, bottom: 6),
      child: pw.Text(
        title,
        style: pw.TextStyle(
          fontSize: 11,
          fontWeight: pw.FontWeight.bold,
          color: const PdfColor.fromInt(0xFF111827),
        ),
      ),
    );
  }

  pw.Widget _buildPdfFieldRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 6),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(
            width: 92,
            child: pw.Text(
              '$label:',
              style: pw.TextStyle(
                fontSize: 10.2,
                fontWeight: pw.FontWeight.bold,
                color: const PdfColor.fromInt(0xFF4B5563),
              ),
            ),
          ),
          pw.Expanded(
            child: pw.Text(
              value,
              style: pw.TextStyle(
                fontSize: 10.2,
                color: const PdfColor.fromInt(0xFF111827),
              ),
            ),
          ),
        ],
      ),
    );
  }

  pw.Widget _buildPdfWatermarkBackground() {
    final pageWidth = PdfPageFormat.a4.width;
    final pageHeight = PdfPageFormat.a4.height;
    const spacingX = 230.0;
    const spacingY = 165.0;

    final labels = <pw.Widget>[];
    var index = 0;
    for (double y = -100; y < pageHeight + 140; y += spacingY) {
      for (double x = -120; x < pageWidth + 160; x += spacingX) {
        final inMainContentArea =
            x > 70 && x < pageWidth - 150 && y > 110 && y < pageHeight - 220;
        if (inMainContentArea) {
          continue;
        }

        final label = _watermarkLabels[index % _watermarkLabels.length];
        index += 1;
        labels.add(
          pw.Positioned(
            left: x,
            top: y,
            child: pw.Transform.rotate(
              angle: -0.52,
              child: pw.Text(
                label,
                style: pw.TextStyle(
                  fontSize: 20,
                  fontWeight: pw.FontWeight.normal,
                  color: const PdfColor.fromInt(0x0294A3B8),
                ),
              ),
            ),
          ),
        );
      }
    }

    return pw.FullPage(ignoreMargins: true, child: pw.Stack(children: labels));
  }

  pw.Widget _buildPdfSignatureBox({
    required String doctorName,
    required String issuedAtText,
  }) {
    final normalizedDoctorName = doctorName == 'N/A'
        ? 'Unknown Doctor'
        : doctorName;
    final signedDoctorName =
        RegExp(
          r'^dr\.?\s+',
          caseSensitive: false,
        ).hasMatch(normalizedDoctorName)
        ? normalizedDoctorName
        : 'Dr. $normalizedDoctorName';

    return pw.Align(
      alignment: pw.Alignment.centerRight,
      child: pw.Container(
        width: 250,
        padding: const pw.EdgeInsets.all(10),
        decoration: pw.BoxDecoration(
          border: pw.Border.all(
            color: const PdfColor.fromInt(0xFF94A3B8),
            width: 0.8,
          ),
          borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
        ),
        child: pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'Signature valid',
                    style: pw.TextStyle(
                      fontSize: 10.5,
                      fontWeight: pw.FontWeight.bold,
                      color: const PdfColor.fromInt(0xFF111827),
                    ),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Text(
                    'Digitally signed by $signedDoctorName',
                    style: pw.TextStyle(
                      fontSize: 8.5,
                      color: const PdfColor.fromInt(0xFF334155),
                    ),
                  ),
                  pw.Text(
                    'Date: $issuedAtText',
                    style: pw.TextStyle(
                      fontSize: 8.5,
                      color: const PdfColor.fromInt(0xFF334155),
                    ),
                  ),
                  pw.Text(
                    'Reason: Approved prescription',
                    style: pw.TextStyle(
                      fontSize: 8.5,
                      color: const PdfColor.fromInt(0xFF334155),
                    ),
                  ),
                ],
              ),
            ),
            pw.Container(
              width: 18,
              height: 18,
              decoration: const pw.BoxDecoration(
                color: PdfColor.fromInt(0xFF22C55E),
                borderRadius: pw.BorderRadius.all(pw.Radius.circular(4)),
              ),
              child: pw.Padding(
                padding: const pw.EdgeInsets.all(2.5),
                child: pw.SvgImage(svg: _signatureTickSvg),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openUrl(String value) async {
    final normalized = value.trim();
    if (normalized.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('File URL is missing.')));
      return;
    }

    final uri =
        normalized.startsWith('http://') || normalized.startsWith('https://')
        ? Uri.parse(normalized)
        : Uri.parse(_toAbsolute(normalized));

    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Could not open file.')));
    }
  }

  String _pdfFileName(PrescriptionModel prescription) {
    final now = DateTime.now();
    final idPart = prescription.id.length > 8
        ? prescription.id.substring(prescription.id.length - 8)
        : prescription.id;
    return 'prescription_${DateFormat('yyyyMMdd_HHmmss').format(now)}_${_safeFileNamePart(idPart)}.pdf';
  }

  Future<Uint8List> _createPrescriptionPdfBytes(
    PrescriptionModel prescription,
  ) async {
    final document = pw.Document();
    final issuedAtText = prescription.issuedAt == null
        ? 'Issued date unavailable'
        : _formatPdfDateTime(prescription.issuedAt!);

    final generatedAtText = _formatPdfDateTime(DateTime.now());
    final doctorName = _pdfValue(prescription.doctorName);
    final patientName = _pdfValue(
      prescription.patientName,
      fallback: 'Registered patient',
    );
    final clinicName = _pdfValue(
      prescription.clinicName,
      fallback: 'Not specified',
    );
    final speciality = _pdfValue(
      prescription.doctorSpecialist,
      fallback: 'Not specified',
    );
    final diagnosis = _pdfValue(
      prescription.diagnosis,
      fallback: 'Not provided',
    );
    final notes = _pdfValue(prescription.notes, fallback: 'Not provided');
    final appointmentText = prescription.appointmentDate.isEmpty
        ? 'Not linked'
        : '${prescription.appointmentDate}'
              '${prescription.appointmentSlot.isEmpty ? '' : ' at ${prescription.appointmentSlot}'}';
    final attachedFile = _pdfValue(
      prescription.file?.fileName,
      fallback: 'No file attached',
    );

    pw.Widget logoWidget;
    try {
      logoWidget = pw.SizedBox(
        width: 220,
        height: 62,
        child: pw.SvgImage(svg: _farishtaaLogoWithNameSvg),
      );
    } catch (_) {
      logoWidget = pw.Text(
        'Farishtaa',
        style: pw.TextStyle(
          color: const PdfColor.fromInt(0xFFDC2626),
          fontSize: 22,
          fontWeight: pw.FontWeight.bold,
        ),
      );
    }

    document.addPage(
      pw.MultiPage(
        pageTheme: pw.PageTheme(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.fromLTRB(48, 48, 48, 48),
          buildBackground: (_) => _buildPdfWatermarkBackground(),
        ),
        footer: (context) {
          if (context.pageNumber != context.pagesCount) {
            return pw.SizedBox.shrink();
          }

          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.stretch,
            children: [
              pw.Divider(color: const PdfColor.fromInt(0xFFD1D5DB)),
              pw.SizedBox(height: 8),
              _buildPdfSignatureBox(
                doctorName: doctorName,
                issuedAtText: issuedAtText,
              ),
            ],
          );
        },
        build: (_) {
          final widgets = <pw.Widget>[
            pw.Center(child: logoWidget),
            pw.SizedBox(height: 8),
            pw.Text(
              'Doctor Prescription',
              style: pw.TextStyle(
                color: const PdfColor.fromInt(0xFFDC2626),
                fontSize: 22,
                fontWeight: pw.FontWeight.bold,
              ),
            ),
            pw.SizedBox(height: 6),
            pw.Text(
              'Generated: $generatedAtText',
              style: pw.TextStyle(
                fontSize: 9.8,
                color: const PdfColor.fromInt(0xFF6B7280),
              ),
            ),
            pw.SizedBox(height: 10),
            pw.Divider(color: const PdfColor.fromInt(0xFFE5E7EB)),
            _buildPdfSectionTitle('Prescription Header'),
            _buildPdfFieldRow('Prescription ID', _pdfValue(prescription.id)),
            _buildPdfFieldRow('Issued At', issuedAtText),
            _buildPdfFieldRow('Appointment', appointmentText),
            _buildPdfSectionTitle('Doctor Details'),
            _buildPdfFieldRow('Doctor', doctorName),
            _buildPdfFieldRow('Speciality', speciality),
            _buildPdfFieldRow('Clinic', clinicName),
            _buildPdfSectionTitle('Patient Details'),
            _buildPdfFieldRow('Patient', patientName),
            if (prescription.patientAge != null)
              _buildPdfFieldRow('Age', '${prescription.patientAge}'),
            if (prescription.patientGender.isNotEmpty)
              _buildPdfFieldRow('Gender', prescription.patientGender),
            _buildPdfSectionTitle('Clinical Summary'),
            _buildPdfFieldRow('Diagnosis', diagnosis),
            _buildPdfFieldRow('Notes', notes),
            _buildPdfSectionTitle('Medication Plan'),
          ];

          if (prescription.medicines.isEmpty) {
            widgets.add(_buildPdfFieldRow('Medicines', 'No medicines listed'));
          } else {
            for (
              var index = 0;
              index < prescription.medicines.length;
              index++
            ) {
              final medicine = prescription.medicines[index];
              widgets.add(
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      '${index + 1}. ${_pdfValue(medicine.name, fallback: 'Unnamed medicine')}',
                      style: pw.TextStyle(
                        fontSize: 10.4,
                        fontWeight: pw.FontWeight.bold,
                        color: const PdfColor.fromInt(0xFF111827),
                      ),
                    ),
                    pw.SizedBox(height: 2),
                    pw.Padding(
                      padding: const pw.EdgeInsets.only(left: 12, bottom: 6),
                      child: pw.Text(
                        'Dosage: ${_pdfValue(medicine.dosage, fallback: '-')}'
                        ' | Frequency: ${_pdfValue(medicine.frequency, fallback: '-')}'
                        ' | Duration: ${_pdfValue(medicine.duration, fallback: '-')}'
                        ' | Instructions: ${_pdfValue(medicine.instructions, fallback: '-')}',
                        style: pw.TextStyle(
                          fontSize: 9.8,
                          color: const PdfColor.fromInt(0xFF374151),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }
          }

          widgets
            ..add(_buildPdfSectionTitle('Attachments'))
            ..add(_buildPdfFieldRow('Attached File', attachedFile));

          return widgets;
        },
      ),
    );

    return document.save();
  }

  Future<void> _downloadRxPdf(PrescriptionModel prescription) async {
    try {
      final bytes = await _createPrescriptionPdfBytes(prescription);
      final fileName = _pdfFileName(prescription);
      try {
        await Printing.sharePdf(bytes: bytes, filename: fileName);
      } catch (_) {
        await Printing.layoutPdf(onLayout: (_) async => bytes);
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to create PDF: $error')));
    }
  }

  Future<void> _showDetails(PrescriptionModel prescription) async {
    try {
      final latest = await widget.patientService.getPrescriptionById(
        token: widget.session.token,
        prescriptionId: prescription.id,
      );

      if (!mounted) {
        return;
      }

      showModalBottomSheet<void>(
        context: context,
        isScrollControlled: true,
        showDragHandle: true,
        builder: (_) {
          return DraggableScrollableSheet(
            expand: false,
            initialChildSize: 0.7,
            maxChildSize: 0.92,
            builder: (_, controller) {
              return ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                children: [
                  Text(
                    latest.doctorName,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    latest.issuedAt == null
                        ? 'Issued date unavailable'
                        : DateFormat(
                            'dd MMM yyyy, h:mm a',
                          ).format(latest.issuedAt!),
                  ),
                  if (latest.doctorSpecialist.isNotEmpty)
                    Text('Speciality: ${latest.doctorSpecialist}'),
                  if (latest.clinicName.isNotEmpty)
                    Text('Clinic: ${latest.clinicName}'),
                  if (latest.appointmentDate.isNotEmpty)
                    Text(
                      'Appointment: ${latest.appointmentDate} ${latest.appointmentSlot}',
                    ),
                  const SizedBox(height: 12),
                  if (latest.diagnosis.isNotEmpty)
                    _SectionCard(
                      title: 'Diagnosis',
                      child: Text(latest.diagnosis),
                    ),
                  if (latest.notes.isNotEmpty)
                    _SectionCard(title: 'Notes', child: Text(latest.notes)),
                  _SectionCard(
                    title: 'Medicines',
                    child: latest.medicines.isEmpty
                        ? const Text('No medicines listed')
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: latest.medicines
                                .map(
                                  (med) => Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Text(
                                      '${med.name}${med.dosage.isEmpty ? '' : ' • ${med.dosage}'}'
                                      '${med.frequency.isEmpty ? '' : ' • ${med.frequency}'}'
                                      '${med.duration.isEmpty ? '' : ' • ${med.duration}'}',
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                  ),
                  OutlinedButton.icon(
                    onPressed: () => _downloadRxPdf(latest),
                    icon: const Icon(Icons.picture_as_pdf_outlined),
                    label: const Text('Download Rx PDF'),
                  ),
                  if (latest.file != null)
                    OutlinedButton.icon(
                      onPressed: () => _openUrl(latest.file!.fileUrl),
                      icon: const Icon(Icons.download_outlined),
                      label: const Text('Download attached file'),
                    ),
                ],
              );
            },
          );
        },
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_canUsePatientPrescriptions) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'Prescriptions are currently available for Patient accounts only.',
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetch,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Prescriptions',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 10),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_prescriptions.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No prescriptions found yet.'),
              ),
            )
          else
            ..._prescriptions.map(
              (item) => Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.doctorName,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      if (item.doctorSpecialist.isNotEmpty)
                        Text(item.doctorSpecialist),
                      const SizedBox(height: 4),
                      Text(
                        item.issuedAt == null
                            ? 'Issued date unavailable'
                            : DateFormat(
                                'dd MMM yyyy, h:mm a',
                              ).format(item.issuedAt!),
                        style: const TextStyle(color: Colors.black54),
                      ),
                      if (item.diagnosis.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text('Diagnosis: ${item.diagnosis}'),
                      ],
                      if (item.medicines.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text('Medicines: ${item.medicines.length}'),
                      ],
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => _downloadRxPdf(item),
                            icon: const Icon(Icons.picture_as_pdf_outlined),
                            label: const Text('Download Rx PDF'),
                          ),
                          OutlinedButton(
                            onPressed: () => _showDetails(item),
                            child: const Text('View Details'),
                          ),
                          if (item.file != null)
                            OutlinedButton.icon(
                              onPressed: () => _openUrl(item.file!.fileUrl),
                              icon: const Icon(Icons.download_outlined),
                              label: const Text('Download attached file'),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 6),
            child,
          ],
        ),
      ),
    );
  }
}
