import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const LOGO = require('../../assets/images/logo.png');

/**
 * Initial branding splash. Shown while the app boots (i18n init, auth
 * configuration) and held for a minimum visible duration so the brand
 * registers even on fast cold-starts. White background to match the
 * shipped logo asset.
 */
export function SplashScreen() {
  return (
    <View style={styles.root}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default SplashScreen;
