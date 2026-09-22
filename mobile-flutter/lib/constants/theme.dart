import 'package:flutter/material.dart';

class ConveeColors {
  static const Color background = Color(0xFF090B0E);
  static const Color card = Color(0xFF0E1117);
  static const Color cardSecondary = Color(0xFF151921);
  static const Color cardLight = Color(0xFF151921);
  static const Color border = Color(0xFF1B2230);
  static const Color text = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF9CA3AF);
  static const Color textMuted = Color(0xFF6B7280);
  
  static const Color primary = Color(0xFF10B981);
  static const Color primaryLight = Color(0x2610B981);
  
  static const Color emerald = Color(0xFF10B981);
  static const Color emeraldLight = Color(0x2610B981);
  
  static const Color amber = Color(0xFFF59E0B);
  static const Color amberLight = Color(0x26F59E0B);
  
  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleLight = Color(0x268B5CF6);
  
  static const Color destructive = Color(0xFFEF4444);
}

ThemeData get aiEducationDarkTheme {
  return ThemeData(
    brightness: Brightness.dark,
    scaffoldBackgroundColor: ConveeColors.background,
    primaryColor: ConveeColors.primary,
    colorScheme: const ColorScheme.dark(
      primary: ConveeColors.primary,
      secondary: ConveeColors.amber,
      surface: ConveeColors.card,
      error: ConveeColors.destructive,
    ),
    cardColor: ConveeColors.card,
    dividerColor: ConveeColors.border,
    appBarTheme: const AppBarTheme(
      backgroundColor: ConveeColors.background,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: ConveeColors.text,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    ),
  );
}

ThemeData get conVeeDarkTheme => aiEducationDarkTheme;
