import { NativeModules, Platform } from 'react-native';

/*
const LINKING_ERROR =
  `The package 'sahha-react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const SahhaReactNative = NativeModules.SahhaReactNative
  ? NativeModules.SahhaReactNative
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

export function multiply(a: number, b: number): Promise<number> {
  return SahhaReactNative.multiply(a, b);
}
*/

const Sahha = NativeModules.SahhaReactNative;

export default Sahha;

export enum SahhaActivity {
  MOTION = 'motion',
  HEALTH = 'health',
}

export enum SahhaActivityStatus {
  PENDING = 0, /// Activity support is pending User permission
  UNAVAILABLE = 1, /// Activity is not supported by the User's device
  DISABLED = 2, /// Activity has been disabled by the User
  ENABLED = 3, /// Activity has been enabled by the User
}
