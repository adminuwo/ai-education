import 'package:flutter/material.dart';
import 'constants/theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'services/api_service.dart';
import 'services/language_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  await LanguageService.init();
  final loggedIn = await ApiService.isLoggedIn();
  runApp(AiEducationApp(initialLoggedIn: loggedIn));
}

class AiEducationApp extends StatelessWidget {
  final bool initialLoggedIn;

  const AiEducationApp({super.key, this.initialLoggedIn = false});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLocale,
      builder: (context, locale, _) {
        return MaterialApp(
          key: ValueKey(locale),
          title: 'AI Education',
          debugShowCheckedModeBanner: false,
          home: initialLoggedIn
              ? HomeScreen(
                  userData: ApiService.currentUser,
                  orgData: ApiService.currentOrg,
                )
              : const LoginScreen(),
      },
    );
  }
}
