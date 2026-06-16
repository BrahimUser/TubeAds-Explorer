import AsyncStorage from '@react-native-async-storage/async-storage';
import RNRestart from 'react-native-restart';

import {
  applyRtlNative,
  i18n,
  LANGUAGE_STORAGE_KEY,
  rtlForLang,
  type AppLanguage,
} from './i18nBootstrap';

export const setAppLanguage = async (next: AppLanguage): Promise<void> => {
  const prevRTL = rtlForLang(i18n.language);
  const nextRTL = rtlForLang(next);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next);
  await i18n.changeLanguage(next);
  applyRtlNative(nextRTL);
  if (prevRTL !== nextRTL) {
    RNRestart.restart();
  }
};
