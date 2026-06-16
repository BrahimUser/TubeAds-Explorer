import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import ar from '../locales/ar.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';

export const LANGUAGE_STORAGE_KEY = '@video_upload_app_language';

export type AppLanguage = 'en' | 'ar' | 'fr';

export const rtlForLang = (lng: string): boolean => lng === 'ar';

export const loadStoredLanguage = async (): Promise<AppLanguage> => {
  const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (raw === 'en' || raw === 'ar' || raw === 'fr') {
    return raw;
  }
  return 'en';
};

export const applyRtlNative = (shouldRTL: boolean) => {
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  I18nManager.forceRTL(shouldRTL);
};

/**
 * Bootstraps i18next and RTL. Lives under `localization/` (not `i18n/`) so Metro
 * cannot confuse this folder with the `i18next` npm package.
 */
export const initI18n = async (): Promise<void> => {
  const lng = await loadStoredLanguage();
  applyRtlNative(rtlForLang(lng));

  if (i18next.isInitialized) {
    await i18next.changeLanguage(lng);
    return;
  }

  await i18next.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
};

export { i18next as i18n };

const i18nBootstrap = {
  initI18n,
  loadStoredLanguage,
  applyRtlNative,
  rtlForLang,
  LANGUAGE_STORAGE_KEY,
} as const;

export default i18nBootstrap;
