import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enTranslations from '@/locales/en.json';
import hiTranslations from '@/locales/hi.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
];

const TRANSLATIONS = {
  en: enTranslations,
  hi: hiTranslations,
};

const LanguageContext = createContext(null);

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

function interpolate(text, params) {
  if (!params || typeof text !== 'string') return text;
  return Object.keys(params).reduce((str, key) => {
    return str.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), params[key])
              .replace(new RegExp(`{\\s*${key}\\s*}`, 'g'), params[key]);
  }, text);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('convee_language');
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch {}
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('convee_language', language);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', language);
      }
    } catch {}
  }, [language]);

  const changeLanguage = useCallback((code) => {
    if (TRANSLATIONS[code]) {
      setLanguageState(code);
    }
  }, []);

  const t = useCallback((key, paramsOrFallback, explicitFallback) => {
    let params = null;
    let fallback = '';

    if (typeof paramsOrFallback === 'string') {
      fallback = paramsOrFallback;
    } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
      params = paramsOrFallback;
      fallback = explicitFallback || '';
    }

    const currentDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let val = getNestedValue(currentDict, key);

    // Fallback to English if not found in current language
    if (val === undefined || val === null || val === '') {
      val = getNestedValue(TRANSLATIONS.en, key);
    }

    // Fallback to provided fallback string or key itself
    if (val === undefined || val === null || val === '') {
      val = fallback || key;
    }

    return interpolate(val, params);
  }, [language]);

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const value = useMemo(() => ({
    language,
    currentLanguage: currentLanguageInfo,
    changeLanguage,
    setLanguage: changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
    // Alias i18n object for easy compatibility
    i18n: {
      language,
      changeLanguage,
      languages: SUPPORTED_LANGUAGES.map((l) => l.code),
    },
  }), [language, currentLanguageInfo, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Provide safe non-throwing fallback if rendered outside provider
    return {
      language: 'en',
      currentLanguage: SUPPORTED_LANGUAGES[0],
      changeLanguage: () => {},
      setLanguage: () => {},
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (key, fallback) => (typeof fallback === 'string' ? fallback : key),
      i18n: { language: 'en', changeLanguage: () => {}, languages: ['en', 'hi'] },
    };
  }
  return ctx;
};

// Export useTranslation alias as well
export const useTranslation = () => {
  const { t, i18n, language, changeLanguage } = useLanguage();
  return { t, i18n, language, changeLanguage };
};

export default LanguageContext;
