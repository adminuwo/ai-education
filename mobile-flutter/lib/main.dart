import 'package:flutter/material.dart';
import 'constants/theme.dart';
import 'screens/login_screen.dart';

import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  runApp(const AiEducationApp());
}

class AiEducationApp extends StatelessWidget {
  const AiEducationApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AI Education',
      debugShowCheckedModeBanner: false,
      theme: aiEducationDarkTheme,
      home: const LoginScreen(),
    );
  }
}
