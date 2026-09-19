import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.cardSecondary, borderColor: colors.border }]}>
      {SUPPORTED_LANGUAGES.map((l) => {
        const isSelected = language === l.code;
        return (
          <TouchableOpacity
            key={l.code}
            onPress={() => setLanguage(l.code as SupportedLanguageCode)}
            style={[
              styles.pill,
              compact && styles.pillCompact,
              isSelected && {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[
                styles.pillText,
                compact && styles.pillTextCompact,
                { color: isSelected ? colors.primary : colors.textSecondary },
                isSelected && styles.pillTextActive,
              ]}
            >
              {l.flag} {compact ? l.nativeLabel : `${l.nativeLabel}`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextCompact: {
    fontSize: 11,
  },
  pillTextActive: {
    fontWeight: '700',
  },
});
