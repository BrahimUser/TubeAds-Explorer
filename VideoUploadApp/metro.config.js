const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Required by @react-navigation v7 (and any other package using the
    // modern `package.json` "exports" field with explicit ".js" extensions
    // in compiled ESM output). Without this, metro fails to bundle with
    //   Unable to resolve module ./useLinkProps.js
    //   from node_modules/@react-navigation/native/lib/module/index.js
    unstable_enablePackageExports: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
