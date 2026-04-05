import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/auth_models.dart';
import '../../models/chat_models.dart';
import '../../services/patient_service.dart';
import '../../theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({
    super.key,
    required this.session,
    required this.patientService,
  });

  final UserSession session;
  final PatientService patientService;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  static const List<String> _suggestions = [
    'I have fever and body pain since yesterday',
    'I have chest pain and shortness of breath',
    'I have severe headache and nausea',
    'I have skin rash and itching',
  ];

  List<ChatSessionModel> _sessions = <ChatSessionModel>[];
  List<ChatMessageModel> _messages = <ChatMessageModel>[];
  ChatSessionModel? _activeSession;
  bool _loading = true;
  bool _sending = false;
  String _language = 'en';
  final _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (_canUsePatientChat) {
      _bootstrap();
    }
  }

  bool get _canUsePatientChat =>
      widget.session.userType.toLowerCase() == 'patient';

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() => _loading = true);
    try {
      final sessions = await widget.patientService.getSessions(
        userId: widget.session.userId,
        token: widget.session.token,
      );
      ChatSessionModel? active = _activeSession;
      if (sessions.isNotEmpty) {
        active = sessions.first;
      }

      List<ChatMessageModel> chats = <ChatMessageModel>[];
      if (active != null) {
        chats = await widget.patientService.getChats(
          userId: widget.session.userId,
          sessionId: active.id,
          token: widget.session.token,
        );
      }

      if (!mounted) {
        return;
      }
      setState(() {
        _sessions = sessions;
        _activeSession = active;
        _messages = chats;
      });
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

  Future<void> _createSession() async {
    setState(() => _loading = true);
    try {
      final session = await widget.patientService.createSession(
        userId: widget.session.userId,
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _sessions = [session, ..._sessions];
        _activeSession = session;
        _messages = <ChatMessageModel>[];
      });
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

  Future<void> _openSession(ChatSessionModel? session) async {
    if (session == null) {
      return;
    }
    setState(() {
      _activeSession = session;
      _loading = true;
    });
    try {
      final chats = await widget.patientService.getChats(
        userId: widget.session.userId,
        sessionId: session.id,
        token: widget.session.token,
      );
      if (!mounted) {
        return;
      }
      setState(() => _messages = chats);
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

  Future<void> _sendPrompt() async {
    if (_sending) {
      return;
    }

    ChatSessionModel? active = _activeSession;
    if (active == null) {
      try {
        final session = await widget.patientService.createSession(
          userId: widget.session.userId,
          token: widget.session.token,
        );
        if (!mounted) {
          return;
        }
        setState(() {
          _sessions = [session, ..._sessions];
          _activeSession = session;
        });
        active = session;
      } catch (error) {
        if (!mounted) {
          return;
        }
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
        return;
      }
    }

    final text = _messageController.text.trim();
    if (text.isEmpty) {
      return;
    }

    _messageController.clear();
    setState(() => _sending = true);
    try {
      final newMessages = await widget.patientService.sendPrompt(
        userId: widget.session.userId,
        sessionId: active.id,
        token: widget.session.token,
        prompt: text,
        language: _language,
      );
      if (!mounted) {
        return;
      }

      final shouldRetitle = active.title == 'New Chat';
      final updatedTitle = _sessionTitleFromPrompt(text);
      setState(() {
        _messages = [..._messages, ...newMessages];
        if (shouldRetitle) {
          final updatedSession = ChatSessionModel(
            id: active!.id,
            title: updatedTitle,
            updatedAt: DateTime.now(),
          );
          _activeSession = updatedSession;
          _sessions = _sessions
              .map(
                (session) =>
                    session.id == updatedSession.id ? updatedSession : session,
              )
              .toList();
        }
      });

      unawaited(_refreshSessionsInBackground(preferredSessionId: active.id));
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

  String _sessionTitleFromPrompt(String prompt) {
    final text = prompt.trim();
    if (text.isEmpty) {
      return 'New Chat';
    }
    return text.length > 40 ? '${text.substring(0, 40)}...' : text;
  }

  Future<void> _refreshSessionsInBackground({
    required String preferredSessionId,
  }) async {
    try {
      final sessions = await widget.patientService.getSessions(
        userId: widget.session.userId,
        token: widget.session.token,
      );

      if (!mounted) {
        return;
      }

      ChatSessionModel? active = _activeSession;
      for (final session in sessions) {
        if (session.id == preferredSessionId) {
          active = session;
          break;
        }
      }

      setState(() {
        _sessions = sessions;
        _activeSession = active;
      });
    } catch (_) {
      // Keep current UI state if background refresh fails.
    }
  }

  Future<void> _deleteActiveSession() async {
    final active = _activeSession;
    if (active == null) {
      return;
    }
    try {
      await widget.patientService.deleteSession(
        userId: widget.session.userId,
        sessionId: active.id,
        token: widget.session.token,
      );
      await _bootstrap();
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
    if (!_canUsePatientChat) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Text(
            'Symptom checker chat is currently available for Patient accounts only.',
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
                  'Symptom Checker',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Delete active chat',
                onPressed: _activeSession == null ? null : _deleteActiveSession,
                icon: const Icon(Icons.delete_outline),
              ),
              FilledButton.tonalIcon(
                onPressed: _loading ? null : _createSession,
                icon: const Icon(Icons.add),
                label: const Text('New'),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<ChatSessionModel>(
                  key: ValueKey(_activeSession?.id ?? 'none'),
                  initialValue: _activeSession,
                  decoration: const InputDecoration(labelText: 'Conversation'),
                  items: _sessions
                      .map(
                        (session) => DropdownMenuItem<ChatSessionModel>(
                          value: session,
                          child: Text(session.title),
                        ),
                      )
                      .toList(),
                  onChanged: _loading ? null : _openSession,
                ),
              ),
              const SizedBox(width: 8),
              DropdownButton<String>(
                value: _language,
                items: const [
                  DropdownMenuItem(value: 'en', child: Text('EN')),
                  DropdownMenuItem(value: 'hi', child: Text('HI')),
                  DropdownMenuItem(value: 'or', child: Text('OR')),
                ],
                onChanged: _sending
                    ? null
                    : (value) {
                        if (value == null) {
                          return;
                        }
                        setState(() => _language = value);
                      },
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _messages.isEmpty
              ? const Center(child: Text('Start a new symptom conversation'))
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
                  itemCount: _messages.length,
                  itemBuilder: (_, index) {
                    final message = _messages[index];
                    return Align(
                      alignment: message.isUser
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 10,
                        ),
                        constraints: const BoxConstraints(maxWidth: 300),
                        decoration: BoxDecoration(
                          color: message.isUser
                              ? AppTheme.primaryBlue
                              : Colors.white,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              message.content,
                              style: TextStyle(
                                color: message.isUser
                                    ? Colors.white
                                    : Colors.black87,
                              ),
                            ),
                            if (message.createdAt != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                DateFormat.jm().format(message.createdAt!),
                                style: TextStyle(
                                  color: message.isUser
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
              Expanded(
                child: TextField(
                  controller: _messageController,
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendPrompt(),
                  maxLines: 4,
                  minLines: 1,
                  decoration: const InputDecoration(
                    hintText: 'Describe your symptoms...',
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: _sending ? null : _sendPrompt,
                icon: _sending
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.send_rounded),
              ),
            ],
          ),
        ),
        if (!_sending)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
            child: Row(
              children: _suggestions
                  .map(
                    (text) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ActionChip(
                        label: Text(text),
                        onPressed: () {
                          _messageController.text = text;
                          _messageController.selection =
                              TextSelection.collapsed(offset: text.length);
                        },
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
      ],
    );
  }
}
