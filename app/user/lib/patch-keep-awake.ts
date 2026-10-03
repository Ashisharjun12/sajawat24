/**
 * Dev Android builds can reject keep-awake before the Activity is ready.
 * expo-keep-awake's useKeepAwake does not catch activate failures → log spam.
 */
import { LogBox, Platform } from 'react-native';

if (__DEV__ && Platform.OS === 'android') {
  LogBox.ignoreLogs([
    /Unable to activate keep awake/,
    /InvocationTargetException/,
  ]);

  // Mutate the CJS export so in-package useKeepAwake also gets the wrapped call.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const keepAwake = require('expo-keep-awake') as typeof import('expo-keep-awake');
  const original = keepAwake.activateKeepAwakeAsync.bind(keepAwake);
  keepAwake.activateKeepAwakeAsync = (tag?: string) => original(tag).catch(() => undefined);
}
