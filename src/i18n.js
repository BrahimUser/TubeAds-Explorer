/**
 * i18n configuration — supports Arabic (default), English, and French.
 * Persists the chosen language in localStorage under `marketplace-locale`
 * (same key already used by the Header language switcher).
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

export const LOCALE_STORAGE_KEY = 'marketplace-locale';
export const DEFAULT_LANGUAGE = 'ar';
export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr'];
export const RTL_LANGUAGES = ['ar'];

function detectInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch {
    /* localStorage may be unavailable (private mode / SSR) */
  }
  const navLang =
    (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) ||
    DEFAULT_LANGUAGE;
  const short = navLang.toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(short) ? short : DEFAULT_LANGUAGE;
}

export function isRtlLanguage(lang) {
  return RTL_LANGUAGES.includes(lang);
}

export function applyLanguageToDocument(lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtlLanguage(lang) ? 'rtl' : 'ltr';
}

const initialLanguage = detectInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

applyLanguageToDocument(initialLanguage);

i18n.on('languageChanged', (lang) => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, lang);
    }
  } catch {
    /* ignore quota / private mode */
  }
  applyLanguageToDocument(lang);
});

export default i18n;
