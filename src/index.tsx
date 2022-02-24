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

const { SahhaReactNative } = NativeModules;

export default SahhaReactNative;
