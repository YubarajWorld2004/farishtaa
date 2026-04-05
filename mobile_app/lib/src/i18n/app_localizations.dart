import 'package:flutter/material.dart';

class AppLocalizations {
  const AppLocalizations(this.locale);

  final Locale locale;

  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('hi'),
    Locale('or'),
  ];

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    final localization = Localizations.of<AppLocalizations>(
      context,
      AppLocalizations,
    );
    assert(localization != null, 'AppLocalizations not found in context');
    return localization!;
  }

  static const Map<String, Map<String, String>> _translations =
      <String, Map<String, String>>{
        'en': <String, String>{
          'app.title': 'Farishtaa',
          'nav.home': 'Home',
          'nav.appointments': 'Appointments',
          'nav.telemed': 'Telemed',
          'nav.chat': 'Chat',
          'nav.account': 'Account',
          'nav.dashboard': 'Dashboard',
          'nav.doctors': 'Doctors',
          'nav.add': 'Add',
          'nav.settings': 'Settings',
          'nav.rx': 'Rx',
          'title.notifications': 'Notifications',
          'title.prescriptions': 'Prescriptions',
          'title.editProfile': 'Edit Profile',
          'title.reviews': 'Reviews',
          'auth.tagline': 'Your health angel at your fingertips',
          'auth.login': 'Login',
          'auth.signUp': 'Sign Up',
          'auth.firstName': 'First name',
          'auth.lastName': 'Last name',
          'auth.email': 'Email',
          'auth.password': 'Password',
          'auth.role': 'Role',
          'auth.age': 'Age',
          'auth.gender': 'Gender',
          'auth.createAccount': 'Create Account',
          'auth.firstNameRequired': 'First name is required',
          'auth.lastNameRequired': 'Last name is required',
          'auth.validEmail': 'Enter a valid email',
          'auth.passwordMin': 'Password should be at least 6 characters',
          'auth.validAge': 'Valid age required',
          'role.patient': 'Patient',
          'role.doctor': 'Doctor',
          'role.hospital': 'Hospital',
          'gender.male': 'Male',
          'gender.female': 'Female',
          'gender.other': 'Other',
          'account.title': 'Account',
          'account.role': 'Role: {role}',
          'account.userId': 'User ID: {id}',
          'account.languagePreference': 'Language Preference',
          'account.languageSubtitle': '{language}',
          'account.notifications': 'Notifications',
          'account.notificationsSubtitle': 'View and mark updates',
          'account.prescriptions': 'Prescriptions',
          'account.prescriptionsSubtitle': 'Medicines and doctor notes',
          'account.telemedicine': 'Telemedicine Sessions',
          'account.telemedicineSubtitle': 'Open active appointment chats',
          'account.hospitalSettings': 'Hospital Settings',
          'account.hospitalSettingsSubtitle':
              'Manage hospital profile information',
          'account.helpSupport': 'Help & Support',
          'account.logout': 'Logout',
          'language.chooseTitle': 'Choose Language',
          'language.chooseSubtitle': 'Select app language',
          'language.english': 'English',
          'language.hindi': 'Hindi',
          'language.odia': 'Odia',
          'language.saved': 'Language updated',
        },
        'hi': <String, String>{
          'app.title': 'फरिश्ता',
          'nav.home': 'होम',
          'nav.appointments': 'अपॉइंटमेंट',
          'nav.telemed': 'टेलीमेड',
          'nav.chat': 'चैट',
          'nav.account': 'अकाउंट',
          'nav.dashboard': 'डैशबोर्ड',
          'nav.doctors': 'डॉक्टर्स',
          'nav.add': 'जोड़ें',
          'nav.settings': 'सेटिंग्स',
          'nav.rx': 'प्रिस्क्रिप्शन',
          'title.notifications': 'नोटिफिकेशन',
          'title.prescriptions': 'प्रिस्क्रिप्शन',
          'title.editProfile': 'प्रोफाइल संपादित करें',
          'title.reviews': 'रिव्यू',
          'auth.tagline': 'आपकी सेहत का फरिश्ता आपकी उंगलियों पर',
          'auth.login': 'लॉगिन',
          'auth.signUp': 'साइन अप',
          'auth.firstName': 'पहला नाम',
          'auth.lastName': 'अंतिम नाम',
          'auth.email': 'ईमेल',
          'auth.password': 'पासवर्ड',
          'auth.role': 'भूमिका',
          'auth.age': 'उम्र',
          'auth.gender': 'लिंग',
          'auth.createAccount': 'अकाउंट बनाएं',
          'auth.firstNameRequired': 'पहला नाम आवश्यक है',
          'auth.lastNameRequired': 'अंतिम नाम आवश्यक है',
          'auth.validEmail': 'सही ईमेल दर्ज करें',
          'auth.passwordMin': 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए',
          'auth.validAge': 'सही उम्र दर्ज करें',
          'role.patient': 'रोगी',
          'role.doctor': 'डॉक्टर',
          'role.hospital': 'अस्पताल',
          'gender.male': 'पुरुष',
          'gender.female': 'महिला',
          'gender.other': 'अन्य',
          'account.title': 'अकाउंट',
          'account.role': 'भूमिका: {role}',
          'account.userId': 'यूजर आईडी: {id}',
          'account.languagePreference': 'भाषा पसंद',
          'account.languageSubtitle': '{language}',
          'account.notifications': 'नोटिफिकेशन',
          'account.notificationsSubtitle': 'अपडेट देखें और पढ़ा हुआ मार्क करें',
          'account.prescriptions': 'प्रिस्क्रिप्शन',
          'account.prescriptionsSubtitle': 'दवाइयाँ और डॉक्टर के नोट्स',
          'account.telemedicine': 'टेलीमेडिसिन सत्र',
          'account.telemedicineSubtitle': 'सक्रिय अपॉइंटमेंट चैट खोलें',
          'account.hospitalSettings': 'अस्पताल सेटिंग्स',
          'account.hospitalSettingsSubtitle':
              'अस्पताल प्रोफाइल जानकारी प्रबंधित करें',
          'account.helpSupport': 'मदद और सपोर्ट',
          'account.logout': 'लॉगआउट',
          'language.chooseTitle': 'भाषा चुनें',
          'language.chooseSubtitle': 'ऐप की भाषा चुनें',
          'language.english': 'English',
          'language.hindi': 'हिंदी',
          'language.odia': 'ଓଡ଼ିଆ',
          'language.saved': 'भाषा अपडेट हो गई',
        },
        'or': <String, String>{
          'app.title': 'ଫରିଶ୍ତା',
          'nav.home': 'ହୋମ୍',
          'nav.appointments': 'ଆପଏଣ୍ଟମେଣ୍ଟ',
          'nav.telemed': 'ଟେଲିମେଡ୍',
          'nav.chat': 'ଚ୍ୟାଟ୍',
          'nav.account': 'ଆକାଉଣ୍ଟ',
          'nav.dashboard': 'ଡ୍ୟାଶବୋର୍ଡ',
          'nav.doctors': 'ଡାକ୍ତରମାନେ',
          'nav.add': 'ଯୋଡନ୍ତୁ',
          'nav.settings': 'ସେଟିଙ୍ଗ୍ସ',
          'nav.rx': 'ପ୍ରେସକ୍ରିପସନ୍',
          'title.notifications': 'ନୋଟିଫିକେସନ୍',
          'title.prescriptions': 'ପ୍ରେସକ୍ରିପସନ୍',
          'title.editProfile': 'ପ୍ରୋଫାଇଲ ସମ୍ପାଦନା',
          'title.reviews': 'ରିଭ୍ୟୁ',
          'auth.tagline': 'ଆପଣଙ୍କ ଆଙ୍ଗୁଠିରେ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟ ଦେବଦୂତ',
          'auth.login': 'ଲଗଇନ୍',
          'auth.signUp': 'ସାଇନ୍ ଅପ୍',
          'auth.firstName': 'ପ୍ରଥମ ନାମ',
          'auth.lastName': 'ଶେଷ ନାମ',
          'auth.email': 'ଇମେଲ୍',
          'auth.password': 'ପାସୱାର୍ଡ',
          'auth.role': 'ଭୂମିକା',
          'auth.age': 'ବୟସ',
          'auth.gender': 'ଲିଙ୍ଗ',
          'auth.createAccount': 'ଆକାଉଣ୍ଟ ସୃଷ୍ଟି କରନ୍ତୁ',
          'auth.firstNameRequired': 'ପ୍ରଥମ ନାମ ଆବଶ୍ୟକ',
          'auth.lastNameRequired': 'ଶେଷ ନାମ ଆବଶ୍ୟକ',
          'auth.validEmail': 'ଠିକ୍ ଇମେଲ୍ ଦିଅନ୍ତୁ',
          'auth.passwordMin': 'ପାସୱାର୍ଡ କମ୍ରେ କମ୍ 6 ଅକ୍ଷର ହେବା ଆବଶ୍ୟକ',
          'auth.validAge': 'ଠିକ୍ ବୟସ ଦିଅନ୍ତୁ',
          'role.patient': 'ରୋଗୀ',
          'role.doctor': 'ଡାକ୍ତର',
          'role.hospital': 'ହସ୍ପିଟାଲ',
          'gender.male': 'ପୁରୁଷ',
          'gender.female': 'ମହିଳା',
          'gender.other': 'ଅନ୍ୟ',
          'account.title': 'ଆକାଉଣ୍ଟ',
          'account.role': 'ଭୂମିକା: {role}',
          'account.userId': 'ଉଜର ଆଇଡି: {id}',
          'account.languagePreference': 'ଭାଷା ପସନ୍ଦ',
          'account.languageSubtitle': '{language}',
          'account.notifications': 'ନୋଟିଫିକେସନ୍',
          'account.notificationsSubtitle':
              'ଅପଡେଟ୍ ଦେଖନ୍ତୁ ଏବଂ ପଢା ଭାବେ ଚିହ୍ନିତ କରନ୍ତୁ',
          'account.prescriptions': 'ପ୍ରେସକ୍ରିପସନ୍',
          'account.prescriptionsSubtitle': 'ଔଷଧ ଏବଂ ଡାକ୍ତରଙ୍କ ଟିପ୍ସ',
          'account.telemedicine': 'ଟେଲିମେଡିସିନ ସେସନ୍',
          'account.telemedicineSubtitle': 'ସକ୍ରିୟ ଆପଏଣ୍ଟମେଣ୍ଟ ଚ୍ୟାଟ୍ ଖୋଲନ୍ତୁ',
          'account.hospitalSettings': 'ହସ୍ପିଟାଲ ସେଟିଂସ୍',
          'account.hospitalSettingsSubtitle':
              'ହସ୍ପିଟାଲ ପ୍ରୋଫାଇଲ ସୂଚନା ପରିଚାଳନା କରନ୍ତୁ',
          'account.helpSupport': 'ସହାୟତା ଏବଂ ସମର୍ଥନ',
          'account.logout': 'ଲଗଆଉଟ୍',
          'language.chooseTitle': 'ଭାଷା ବାଛନ୍ତୁ',
          'language.chooseSubtitle': 'ଆପ୍ ଭାଷା ବାଛନ୍ତୁ',
          'language.english': 'English',
          'language.hindi': 'हिंदी',
          'language.odia': 'ଓଡ଼ିଆ',
          'language.saved': 'ଭାଷା ଅଦ୍ୟତନ ହେଲା',
        },
      };

  String t(
    String key, {
    Map<String, String> params = const <String, String>{},
  }) {
    final code = _translations.containsKey(locale.languageCode)
        ? locale.languageCode
        : 'en';
    var value = _translations[code]?[key] ?? _translations['en']?[key] ?? key;
    params.forEach((String paramKey, String paramValue) {
      value = value.replaceAll('{$paramKey}', paramValue);
    });
    return value;
  }

  String languageName(String languageCode) {
    switch (languageCode) {
      case 'hi':
        return t('language.hindi');
      case 'or':
        return t('language.odia');
      case 'en':
      default:
        return t('language.english');
    }
  }
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return AppLocalizations.supportedLocales
        .map((Locale item) => item.languageCode)
        .contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) {
    return false;
  }
}

extension AppLocalizationsBuildContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
}
