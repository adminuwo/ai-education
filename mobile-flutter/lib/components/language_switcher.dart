import 'package:flutter/material.dart';
import '../constants/theme.dart';
import '../services/language_service.dart';

class LanguageSwitcher extends StatelessWidget {
  final bool compact;

  const LanguageSwitcher({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: LanguageService.currentLocale,
      builder: (context, currentLang, _) {
        return Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: ConveeColors.cardSecondary,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: ConveeColors.border),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildPill('en', '🇬🇧', 'English', currentLang == 'en'),
              const SizedBox(width: 2),
              _buildPill('hi', '🇮🇳', 'हिंदी', currentLang == 'hi'),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPill(String code, String flag, String label, bool isSelected) {
    return InkWell(
      onTap: () => LanguageService.setLanguage(code),
      borderRadius: BorderRadius.circular(9),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: compact ? 8 : 12,
          vertical: compact ? 4 : 6,
        ),
        decoration: BoxDecoration(
          color: isSelected ? ConveeColors.primaryLight : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
          border: Border.all(
            color: isSelected ? ConveeColors.primary : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(flag, style: TextStyle(fontSize: compact ? 11 : 12)),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: compact ? 11 : 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                color: isSelected ? ConveeColors.primary : ConveeColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
