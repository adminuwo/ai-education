// i18n entrypoint and resource manifest for Convee Education
import en from '@/locales/en.json';
import hi from '@/locales/hi.json';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

export const defaultLanguage = 'en';
export const supportedLanguages = ['en', 'hi'];

export default {
  resources,
  defaultLanguage,
  supportedLanguages,
};
