import { NativeModules } from 'react-native';

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

  */

export enum SahhaEnvironment {
  development = 'development',
  production = 'production',
}

export enum SahhaActivityStatus {
  pending = 0, /// Activity support is pending User permission
  unavailable = 1, /// Activity is not supported by the User's device
  disabled = 2, /// Activity has been disabled by the User
  enabled = 3, /// Activity has been enabled by the User
}

const Sahha = NativeModules.SahhaReactNative;
export default Sahha;
