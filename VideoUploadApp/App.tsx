import React, { useEffect, useState } from 'react';
import { I18nManager, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, type Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthProfileProvider } from './src/context/AuthProfileContext';
import { RootStack } from './src/navigation/RootStack';
import { SplashScreen } from './src/components/SplashScreen';
import { colors, typography } from './src/theme';

/** Minimum branded splash duration when readiness finishes early (ms). */
const SPLASH_MIN_MS = 400;

const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.secondary,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.brand,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: typography.display.fontWeight },
  },
};

function AppNavigation() {
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <SplashScreen />
      </View>
    );
  }

  return (
    <AuthProfileProvider>
      <NavigationContainer
        theme={navigationTheme}
        direction={I18nManager.isRTL ? 'rtl' : 'ltr'}
      >
        <RootStack />
      </NavigationContainer>
    </AuthProfileProvider>
  );
}

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const mod = await import('./src/localization/i18nBootstrap');
        const runInit = mod.initI18n ?? mod.default?.initI18n;
        if (typeof runInit === 'function') {
          await runInit();
        }
      } catch {
        // Still allow the app to mount if i18n fails (e.g. dev misconfig).
      }
      if (!cancelled) {
        setI18nReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showBrandedSplash = !i18nReady || !minSplashElapsed;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={showBrandedSplash ? '#FFFFFF' : colors.bg}
          translucent={false}
        />
        {showBrandedSplash ? (
          <SplashScreen />
        ) : (
          <AuthProvider>
            <AppNavigation />
          </AuthProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
