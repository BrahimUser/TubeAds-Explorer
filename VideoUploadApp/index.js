/**
 * @format
 */

// MUST be the first import. Pulls the native gesture-handler module in
// before anything else touches it — required by @react-navigation v7's
// stack navigator (and any other consumer of GestureHandlerRootView).
import 'react-native-gesture-handler';

import { AppRegistry, I18nManager } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

I18nManager.allowRTL(true);

AppRegistry.registerComponent(appName, () => App);
