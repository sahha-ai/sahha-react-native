import { NativeModules } from 'react-native';

export enum SahhaEnvironment {
  development = 'development',
  production = 'production',
}

export enum SahhaSensor {
  sleep = 'sleep',
  pedometer = 'pedometer',
  device = 'device',
}

export enum SahhaActivity {
  motion = 'motion',
  health = 'health',
}

export enum SahhaActivityStatus {
  pending = 0, /// Activity support is pending User permission
  unavailable = 1, /// Activity is not supported by the User's device
  disabled = 2, /// Activity has been disabled by the User
  enabled = 3, /// Activity has been enabled by the User
}

const Sahha = NativeModules.SahhaReactNative;
export default Sahha;
