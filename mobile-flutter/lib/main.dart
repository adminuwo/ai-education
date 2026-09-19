import 'package:flutter/material.dart';
import 'constants/theme.dart';
import 'screens/login_screen.dart';
import 'services/api_service.dart';
import 'services/language_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  await LanguageService.init();
  runApp(const AiEducationApp());
}

class AiEducationApp extends StatelessWidget {
  const AiEducationApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLocale,
      builder: (context, locale, _) {
        return MaterialApp(
          key: ValueKey(locale),
          title: 'AI Education',
          debugShowCheckedModeBanner: false,
          theme: aiEducationDarkTheme,
          home: const LoginScreen(),
        );
      },
    );
  }
}
