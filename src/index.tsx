/*

import { NativeModules, Platform } from 'react-native';

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
*/

import { NativeModules } from 'react-native';

export enum SahhaEnvironment {
  development = 'development',
  production = 'production',
}

export enum SahhaSensor {
  sleep = 'sleep',
  pedometer = 'pedometer',
  device = 'device',
  heart = 'heart',
  blood = 'blood',
}

export enum SahhaSensorStatus {
  pending = 0, /// Sensor data is pending User permission
  unavailable = 1, /// Sensor data is not supported by the User's device
  disabled = 2, /// Sensor data has been disabled by the User
  enabled = 3, /// Sensor data has been enabled by the User
}

const Sahha = NativeModules.SahhaReactNative;
export default Sahha;
