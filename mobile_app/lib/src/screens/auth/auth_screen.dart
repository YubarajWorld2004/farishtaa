import 'package:flutter/material.dart';

import '../../i18n/app_locale_controller.dart';
import '../../i18n/app_localizations.dart';
import '../../models/auth_models.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.authService,
    required this.onLoggedIn,
    required this.localeController,
  });

  final AuthService authService;
  final Future<void> Function(UserSession) onLoggedIn;
  final AppLocaleController localeController;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _submitting = false;

  final _formKey = GlobalKey<FormState>();

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _ageController = TextEditingController(text: '26');

  String _gender = 'Male';
  String _userType = 'Patient';

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    final form = _formKey.currentState;
    if (form == null || !form.validate()) {
      return;
    }

    setState(() => _submitting = true);
    try {
      if (_isLogin) {
        final session = await widget.authService.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        await widget.onLoggedIn(session);
      } else {
        await widget.authService.signup(
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          userType: _userType,
          age: int.tryParse(_ageController.text.trim()) ?? 0,
          gender: _gender,
        );

        final session = await widget.authService.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
        await widget.onLoggedIn(session);
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Farishtaa',
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(
                              fontWeight: FontWeight.w900,
                              color: AppTheme.dangerRed,
                            ),
                      ),
                    ),
                    PopupMenuButton<String>(
                      tooltip: l10n.t('language.chooseTitle'),
                      icon: const Icon(Icons.translate),
                      onSelected: (value) {
                        widget.localeController.setLocaleByCode(value);
                      },
                      itemBuilder: (_) => <PopupMenuEntry<String>>[
                        PopupMenuItem<String>(
                          value: 'en',
                          child: Text(l10n.t('language.english')),
                        ),
                        PopupMenuItem<String>(
                          value: 'hi',
                          child: Text(l10n.t('language.hindi')),
                        ),
                        PopupMenuItem<String>(
                          value: 'or',
                          child: Text(l10n.t('language.odia')),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  l10n.t('auth.tagline'),
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                ),
                const SizedBox(height: 20),
                SegmentedButton<bool>(
                  segments: [
                    ButtonSegment<bool>(
                      value: true,
                      label: Text(l10n.t('auth.login')),
                    ),
                    ButtonSegment<bool>(
                      value: false,
                      label: Text(l10n.t('auth.signUp')),
                    ),
                  ],
                  selected: {_isLogin},
                  onSelectionChanged: (value) {
                    setState(() {
                      _isLogin = value.first;
                    });
                  },
                ),
                const SizedBox(height: 20),
                if (!_isLogin) ...[
                  TextFormField(
                    controller: _firstNameController,
                    decoration: InputDecoration(
                      labelText: l10n.t('auth.firstName'),
                    ),
                    validator: (value) {
                      if (!_isLogin &&
                          (value == null || value.trim().isEmpty)) {
                        return l10n.t('auth.firstNameRequired');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _lastNameController,
                    decoration: InputDecoration(
                      labelText: l10n.t('auth.lastName'),
                    ),
                    validator: (value) {
                      if (!_isLogin &&
                          (value == null || value.trim().isEmpty)) {
                        return l10n.t('auth.lastNameRequired');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(labelText: l10n.t('auth.email')),
                  validator: (value) {
                    final email = value?.trim() ?? '';
                    if (email.isEmpty || !email.contains('@')) {
                      return l10n.t('auth.validEmail');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: l10n.t('auth.password'),
                  ),
                  validator: (value) {
                    if ((value ?? '').length < 6) {
                      return l10n.t('auth.passwordMin');
                    }
                    return null;
                  },
                ),
                if (!_isLogin) ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _userType,
                    decoration: InputDecoration(labelText: l10n.t('auth.role')),
                    items: [
                      DropdownMenuItem(
                        value: 'Patient',
                        child: Text(l10n.t('role.patient')),
                      ),
                      DropdownMenuItem(
                        value: 'Doctor',
                        child: Text(l10n.t('role.doctor')),
                      ),
                      DropdownMenuItem(
                        value: 'Hospital',
                        child: Text(l10n.t('role.hospital')),
                      ),
                    ],
                    onChanged: (value) =>
                        setState(() => _userType = value ?? 'Patient'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _ageController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: l10n.t('auth.age'),
                          ),
                          validator: (value) {
                            final parsed = int.tryParse((value ?? '').trim());
                            if (!_isLogin && (parsed == null || parsed <= 0)) {
                              return l10n.t('auth.validAge');
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _gender,
                          decoration: InputDecoration(
                            labelText: l10n.t('auth.gender'),
                          ),
                          items: [
                            DropdownMenuItem(
                              value: 'Male',
                              child: Text(l10n.t('gender.male')),
                            ),
                            DropdownMenuItem(
                              value: 'Female',
                              child: Text(l10n.t('gender.female')),
                            ),
                            DropdownMenuItem(
                              value: 'Other',
                              child: Text(l10n.t('gender.other')),
                            ),
                          ],
                          onChanged: (value) =>
                              setState(() => _gender = value ?? 'Male'),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 18),
                ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2.4),
                        )
                      : Text(
                          _isLogin
                              ? l10n.t('auth.login')
                              : l10n.t('auth.createAccount'),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
