import 'package:flutter/material.dart';

import '../../models/auth_models.dart';
import '../../services/auth_service.dart';
import '../../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.authService,
    required this.onLoggedIn,
  });

  final AuthService authService;
  final Future<void> Function(UserSession) onLoggedIn;

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
                Text(
                  'Farishtaa',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: AppTheme.dangerRed,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Your health angel at your fingertips',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                ),
                const SizedBox(height: 20),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment<bool>(value: true, label: Text('Login')),
                    ButtonSegment<bool>(value: false, label: Text('Sign Up')),
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
                    decoration: const InputDecoration(labelText: 'First name'),
                    validator: (value) {
                      if (!_isLogin &&
                          (value == null || value.trim().isEmpty)) {
                        return 'First name is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _lastNameController,
                    decoration: const InputDecoration(labelText: 'Last name'),
                    validator: (value) {
                      if (!_isLogin &&
                          (value == null || value.trim().isEmpty)) {
                        return 'Last name is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                ],
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: (value) {
                    final email = value?.trim() ?? '';
                    if (email.isEmpty || !email.contains('@')) {
                      return 'Enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                  validator: (value) {
                    if ((value ?? '').length < 6) {
                      return 'Password should be at least 6 characters';
                    }
                    return null;
                  },
                ),
                if (!_isLogin) ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _userType,
                    decoration: const InputDecoration(labelText: 'Role'),
                    items: const [
                      DropdownMenuItem(
                        value: 'Patient',
                        child: Text('Patient'),
                      ),
                      DropdownMenuItem(value: 'Doctor', child: Text('Doctor')),
                      DropdownMenuItem(
                        value: 'Hospital',
                        child: Text('Hospital'),
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
                          decoration: const InputDecoration(labelText: 'Age'),
                          validator: (value) {
                            final parsed = int.tryParse((value ?? '').trim());
                            if (!_isLogin && (parsed == null || parsed <= 0)) {
                              return 'Valid age required';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _gender,
                          decoration: const InputDecoration(
                            labelText: 'Gender',
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: 'Male',
                              child: Text('Male'),
                            ),
                            DropdownMenuItem(
                              value: 'Female',
                              child: Text('Female'),
                            ),
                            DropdownMenuItem(
                              value: 'Other',
                              child: Text('Other'),
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
                      : Text(_isLogin ? 'Login' : 'Create Account'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
