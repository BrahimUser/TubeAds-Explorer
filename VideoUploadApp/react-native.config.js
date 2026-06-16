/**
 * Helps RN CLI / tooling resolve the Android application id consistently
 * (must match namespace + applicationId in android/app/build.gradle).
 */
module.exports = {
  project: {
    android: {
      sourceDir: 'android',
      appName: 'app',
      packageName: 'com.videouploadapp2026',
    },
  },
};
