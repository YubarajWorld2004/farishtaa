import 'package:flutter/material.dart';

import '../../i18n/app_locale_controller.dart';
import '../../i18n/app_localizations.dart';
import '../../models/auth_models.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({
    super.key,
    required this.session,
    required this.onLogout,
    required this.onOpenPrescriptions,
    required this.onOpenNotifications,
    required this.onOpenTelemedicine,
    required this.localeController,
    this.onOpenHospitalSettings,
  });

  final UserSession session;
  final VoidCallback onLogout;
  final VoidCallback onOpenPrescriptions;
  final VoidCallback onOpenNotifications;
  final VoidCallback onOpenTelemedicine;
  final AppLocaleController localeController;
  final VoidCallback? onOpenHospitalSettings;

  Future<void> _openLanguagePicker(BuildContext context) async {
    final l10n = context.l10n;
    final selected = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (_) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: Text(
                  l10n.t('language.chooseTitle'),
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: Text(l10n.t('language.chooseSubtitle')),
              ),
              ListTile(
                title: Text(l10n.t('language.english')),
                trailing: localeController.locale.languageCode == 'en'
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () => Navigator.of(context).pop('en'),
              ),
              ListTile(
                title: Text(l10n.t('language.hindi')),
                trailing: localeController.locale.languageCode == 'hi'
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () => Navigator.of(context).pop('hi'),
              ),
              ListTile(
                title: Text(l10n.t('language.odia')),
                trailing: localeController.locale.languageCode == 'or'
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: () => Navigator.of(context).pop('or'),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );

    if (selected == null) {
      return;
    }

    await localeController.setLocaleByCode(selected);
    if (!context.mounted) {
      return;
    }

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(context.l10n.t('language.saved'))));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final role = session.userType.toLowerCase();
    final isHospital = role == 'hospital';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          l10n.t('account.title'),
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  child: Text(
                    (session.firstName.isEmpty ? 'U' : session.firstName[0])
                        .toUpperCase(),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.firstName,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        l10n.t(
                          'account.role',
                          params: <String, String>{'role': session.userType},
                        ),
                      ),
                      Text(
                        l10n.t(
                          'account.userId',
                          params: <String, String>{'id': session.userId},
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.language),
                title: Text(l10n.t('account.languagePreference')),
                subtitle: Text(
                  l10n.t(
                    'account.languageSubtitle',
                    params: <String, String>{
                      'language': l10n.languageName(
                        localeController.locale.languageCode,
                      ),
                    },
                  ),
                ),
                onTap: () => _openLanguagePicker(context),
              ),
              if (!isHospital)
                ListTile(
                  leading: const Icon(Icons.notifications_active_outlined),
                  title: Text(l10n.t('account.notifications')),
                  subtitle: Text(l10n.t('account.notificationsSubtitle')),
                  onTap: onOpenNotifications,
                ),
              if (!isHospital)
                ListTile(
                  leading: const Icon(Icons.receipt_long_outlined),
                  title: Text(l10n.t('account.prescriptions')),
                  subtitle: Text(l10n.t('account.prescriptionsSubtitle')),
                  onTap: onOpenPrescriptions,
                ),
              if (!isHospital)
                ListTile(
                  leading: const Icon(Icons.videocam_outlined),
                  title: Text(l10n.t('account.telemedicine')),
                  subtitle: Text(l10n.t('account.telemedicineSubtitle')),
                  onTap: onOpenTelemedicine,
                ),
              if (isHospital)
                ListTile(
                  leading: const Icon(Icons.settings_outlined),
                  title: Text(l10n.t('account.hospitalSettings')),
                  subtitle: Text(l10n.t('account.hospitalSettingsSubtitle')),
                  onTap: onOpenHospitalSettings,
                ),
              ListTile(
                leading: const Icon(Icons.help_outline),
                title: Text(l10n.t('account.helpSupport')),
                onTap: () {},
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: onLogout,
          icon: const Icon(Icons.logout),
          label: Text(l10n.t('account.logout')),
        ),
      ],
    );
  }
}
