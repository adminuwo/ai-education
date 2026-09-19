import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storage } from '../lib/storage';
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';

export type SupportedLanguageCode = 'en' | 'hi';

export interface LanguageInfo {
  code: SupportedLanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
];

const TRANSLATIONS: Record<SupportedLanguageCode, Record<string, any>> = {
  en: enTranslations,
  hi: hiTranslations,
};

interface LanguageContextType {
  language: SupportedLanguageCode;
  currentLanguage: LanguageInfo;
  setLanguage: (code: SupportedLanguageCode) => void;
  toggleLanguage: () => void;
  supportedLanguages: LanguageInfo[];
  t: (key: string, arg1?: string | Record<string, any>, arg2?: string | Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  currentLanguage: SUPPORTED_LANGUAGES[0],
  setLanguage: () => {},
  toggleLanguage: () => {},
  supportedLanguages: SUPPORTED_LANGUAGES,
  t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
});

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(text: string, params: Record<string, any> | null): string {
  if (!params || typeof text !== 'string') return text;
  return Object.keys(params).reduce((str, key) => {
    const rawVal = params[key];
    const val = rawVal !== undefined && rawVal !== null ? String(rawVal) : '';
    return str.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), val)
              .replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), val);
  }, text);
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguageCode>('en');

  useEffect(() => {
    storage.get('app_language').then((saved) => {
      if (saved && (saved === 'en' || saved === 'hi')) {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = useCallback((code: SupportedLanguageCode) => {
    if (code === 'en' || code === 'hi') {
      setLanguageState(code);
      storage.set('app_language', code);
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: SupportedLanguageCode = prev === 'en' ? 'hi' : 'en';
      storage.set('app_language', next);
      return next;
    });
  }, []);

  const t = useCallback((key: string, arg1?: string | Record<string, any>, arg2?: string | Record<string, any>): string => {
    let fallback = '';
    let params: Record<string, any> | null = null;

    if (typeof arg1 === 'string') {
      fallback = arg1;
      if (arg2 && typeof arg2 === 'object') {
        params = arg2;
      }
    } else if (arg1 && typeof arg1 === 'object') {
      params = arg1;
      if (typeof arg2 === 'string') {
        fallback = arg2;
      }
    } else if (typeof arg2 === 'string') {
      fallback = arg2;
    }

    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let val = getNestedValue(currentDict, key);

    if (val === undefined || val === null || val === '') {
      val = getNestedValue(TRANSLATIONS.en, key);
    }

    if (val === undefined || val === null || val === '') {
      val = fallback || key;
    }

    return interpolate(String(val), params);
  }, [language]);

  const currentLanguage = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(() => ({
    language,
    currentLanguage,
    setLanguage,
    toggleLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
  }), [language, currentLanguage, setLanguage, toggleLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
