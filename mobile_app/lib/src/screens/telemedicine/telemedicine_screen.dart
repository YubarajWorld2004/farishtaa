import 'dart:async';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/auth_models.dart';
import '../../models/telemedicine_models.dart';
import '../../config/app_config.dart';
import '../../services/api_client.dart';
import '../../services/patient_service.dart';
import '../../theme/app_theme.dart';

class TelemedicineScreen extends StatefulWidget {
  const TelemedicineScreen({
    super.key,
    required this.session,
    required this.patientService,
    this.initialSessionId,
  });

  final UserSession session;
  final PatientService patientService;
  final String? initialSessionId;

  @override
  State<TelemedicineScreen> createState() => _TelemedicineScreenState();
}

class _TelemedicineScreenState extends State<TelemedicineScreen> {
  static const _pollEvery = Duration(seconds: 6);

  final _messageController = TextEditingController();

  List<TelemedicineSessionModel> _sessions = <TelemedicineSessionModel>[];
  List<TelemedicineMessageModel> _messages = <TelemedicineMessageModel>[];
  List<File> _selectedFiles = <File>[];

  TelemedicineSessionModel? _activeSession;

  bool _loadingSessions = true;
  bool _loadingMessages = false;
  bool _sending = false;

  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    if (_canUsePatientTelemedicine) {
      _bootstrap();
    }
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  bool get _canUsePatientTelemedicine =>
      widget.session.userType.toLowerCase() == 'patient';

  Future<void> _bootstrap() async {
    setState(() => _loadingSessions = true);
    try {
      final sessions = await widget.patientService.getTelemedicineSessions(
        token: widget.session.token,
      );

      TelemedicineSessionModel? active;
      final initial = widget.initialSessionId;

      if (initial != null && initial.isNotEmpty) {
        for (final session in sessions) {
          if (session.id == initial) {
            active = session;
            break;
          }
        }
      }

      if (active == null && _activeSession != null) {
        for (final session in sessions) {
          if (session.id == _activeSession!.id) {
            active = session;
            break;
          }
        }
      }

      active ??= sessions.isEmpty ? null : sessions.first;

      if (!mounted) {
        return;
      }
      setState(() {
        _sessions = sessions;
        _activeSession = active;
      });

      await _loadMessages();
      _startPolling();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _loadingSessions = false);
      }
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    final active = _activeSession;
    if (active == null) {
      return;
    }

    _pollTimer = Timer.periodic(_pollEvery, (_) async {
      if (!mounted || _loadingMessages) {
        return;
      }
      await _loadMessages(silent: true);
    });
  }

  bool _hasMessageListChanged(List<TelemedicineMessageModel> next) {
    if (_messages.length != next.length) {
      return true;
    }

    for (var index = 0; index < _messages.length; index += 1) {
      final previous = _messages[index];
      final incoming = next[index];

      if (previous.id != incoming.id) {
        return true;
      }
      if (previous.content != incoming.content) {
        return true;
      }
      if ((previous.createdAt?.millisecondsSinceEpoch ?? 0) !=
          (incoming.createdAt?.millisecondsSinceEpoch ?? 0)) {
        return true;
      }
      if (previous.attachments.length != incoming.attachments.length) {
        return true;
      }
    }

    return false;
  }

  Future<void> _loadMessages({bool silent = false}) async {
    final active = _activeSession;
    if (active == null) {
      setState(() => _messages = <TelemedicineMessageModel>[]);
      return;
    }

    if (silent) {
      _loadingMessages = true;
    } else {
      setState(() => _loadingMessages = true);
    }

    try {
      final messages = await widget.patientService.getTelemedicineMessages(
        token: widget.session.token,
        sessionId: active.id,
      );
      if (!mounted) {
        return;
      }

      if (silent) {
        _loadingMessages = false;
        if (_hasMessageListChanged(messages)) {
          setState(() => _messages = messages);
        }
      } else {
        setState(() {
          _messages = messages;
          _loadingMessages = false;
        });
      }
    } catch (error) {
      if (!mounted) {
        return;
      }

      if (error is ApiException && error.statusCode == 403) {
        setState(() {
          _messages = <TelemedicineMessageModel>[];
          _activeSession = null;
          _loadingMessages = false;
        });
        await _bootstrap();
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        if (silent) {
          _loadingMessages = false;
        } else if (_loadingMessages) {
          setState(() => _loadingMessages = false);
        }
      }
    }
  }

  Future<void> _send() async {
    final active = _activeSession;
    if (active == null || _sending) {
      return;
    }
    if (active.isBlockedForPatient) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Telemedicine chat is unavailable for this appointment.',
          ),
        ),
      );
      return;
    }

    final text = _messageController.text.trim();
    if (text.isEmpty && _selectedFiles.isEmpty) {
      return;
    }

    final attachments = List<File>.from(_selectedFiles);
    _messageController.clear();
    setState(() {
      _sending = true;
      _selectedFiles = <File>[];
    });

    try {
      final message = await widget.patientService.sendTelemedicineMessage(
        token: widget.session.token,
        sessionId: active.id,
        content: text,
        files: attachments,
      );
      if (!mounted) {
        return;
      }

      setState(() => _messages = [..._messages, message]);
      await _bootstrap();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _sending = false);
      }
    }
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true);
    if (result == null) {
      return;
    }

    final files = result.paths
        .whereType<String>()
        .map((path) => File(path))
        .toList();

    if (!mounted) {
      return;
    }

    setState(() => _selectedFiles = files);
  }

  Future<void> _openAttachment(String url) async {
    final uri = Uri.parse(url);
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to open attachment.')),
      );
    }
  }

  String _toAbsoluteUrl(String value) {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    final base = AppConfig.baseUrl.replaceFirst(RegExp(r'/$'), '');
    final normalized = value.startsWith('/') ? value : '/$value';
    return '$base$normalized';
  }

  @override
  Widget build(BuildContext context) {
    if (!_canUsePatientTelemedicine) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'Telemedicine is currently available for Patient accounts only.',
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Telemedicine',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Refresh sessions',
                onPressed: _loadingSessions ? null : _bootstrap,
                icon: const Icon(Icons.refresh),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: _loadingSessions
              ? const LinearProgressIndicator(minHeight: 2)
              : DropdownButtonFormField<String>(
                  initialValue: _activeSession?.id,
                  decoration: const InputDecoration(
                    labelText: 'Active session',
                  ),
                  items: _sessions
                      .map(
                        (session) => DropdownMenuItem<String>(
                          value: session.id,
                          child: Text(
                            '${session.doctorName} • ${session.appointmentDate} ${session.appointmentSlot}',
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      )
                      .toList(),
                  onChanged: (value) {
                    if (value == null) {
                      return;
                    }
                    setState(() {
                      _activeSession = _sessions.firstWhere(
                        (item) => item.id == value,
                      );
                    });
                    _loadMessages();
                    _startPolling();
                  },
                ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _activeSession == null
              ? const Center(
                  child: Text('No active telemedicine sessions found.'),
                )
              : Column(
                  children: [
                    if (_activeSession!.isBlockedForPatient)
                      Container(
                        width: double.infinity,
                        margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFF6DD),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Telemedicine chat is unavailable for this appointment status.',
                        ),
                      ),
                    Expanded(
                      child: _loadingMessages && _messages.isEmpty
                          ? const Center(child: CircularProgressIndicator())
                          : _messages.isEmpty
                          ? const Center(child: Text('No messages yet.'))
                          : ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
                              itemCount: _messages.length,
                              itemBuilder: (_, index) {
                                final message = _messages[index];
                                final mine =
                                    message.senderType.toLowerCase() ==
                                    'patient';
                                return Align(
                                  alignment: mine
                                      ? Alignment.centerRight
                                      : Alignment.centerLeft,
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 10),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 10,
                                    ),
                                    constraints: const BoxConstraints(
                                      maxWidth: 310,
                                    ),
                                    decoration: BoxDecoration(
                                      color: mine
                                          ? AppTheme.primaryBlue
                                          : Colors.white,
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          message.senderName,
                                          style: TextStyle(
                                            color: mine
                                                ? Colors.white70
                                                : Colors.black45,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        if (message.content.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            message.content,
                                            style: TextStyle(
                                              color: mine
                                                  ? Colors.white
                                                  : Colors.black87,
                                            ),
                                          ),
                                        ],
                                        if (message.attachments.isNotEmpty) ...[
                                          const SizedBox(height: 6),
                                          ...message.attachments.map(
                                            (attachment) => Padding(
                                              padding: const EdgeInsets.only(
                                                bottom: 4,
                                              ),
                                              child: InkWell(
                                                onTap: () => _openAttachment(
                                                  _toAbsoluteUrl(
                                                    attachment.fileUrl,
                                                  ),
                                                ),
                                                child: Text(
                                                  attachment.fileName,
                                                  style: TextStyle(
                                                    color: mine
                                                        ? Colors.white
                                                        : AppTheme.primaryBlue,
                                                    decoration: TextDecoration
                                                        .underline,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ),
                                        ],
                                        if (message.createdAt != null) ...[
                                          const SizedBox(height: 3),
                                          Text(
                                            DateFormat(
                                              'dd MMM, h:mm a',
                                            ).format(message.createdAt!),
                                            style: TextStyle(
                                              color: mine
                                                  ? Colors.white70
                                                  : Colors.black45,
                                              fontSize: 11,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                    Container(
                      padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: Color(0x12000000),
                            blurRadius: 9,
                            offset: Offset(0, -2),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            tooltip: 'Attach files',
                            onPressed:
                                _sending || _activeSession!.isBlockedForPatient
                                ? null
                                : _pickFiles,
                            icon: const Icon(Icons.attach_file),
                          ),
                          Expanded(
                            child: TextField(
                              controller: _messageController,
                              enabled: !_activeSession!.isBlockedForPatient,
                              textInputAction: TextInputAction.send,
                              onSubmitted: (_) => _send(),
                              maxLines: 4,
                              minLines: 1,
                              decoration: const InputDecoration(
                                hintText: 'Type message...',
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(
                            onPressed:
                                _sending || _activeSession!.isBlockedForPatient
                                ? null
                                : _send,
                            icon: _sending
                                ? const SizedBox(
                                    width: 18,
                                    height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Icon(Icons.send_rounded),
                          ),
                        ],
                      ),
                    ),
                    if (_selectedFiles.isNotEmpty)
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                        color: Colors.white,
                        child: Text(
                          '${_selectedFiles.length} file(s): ${_selectedFiles.map((file) => file.path.split('\\').last).join(', ')}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.black54,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 2,
                        ),
                      ),
                  ],
                ),
        ),
      ],
    );
  }
}
