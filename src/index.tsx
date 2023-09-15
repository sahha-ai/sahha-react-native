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
  sandbox = 'sandbox',
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

interface SahhaInterface {
  configure(settings: Object, callback: (error: string, success: boolean)=>void):void;
  isAuthenticated(callback: (error: string, success: boolean)=>void):void
  authenticate(appId: string, appSecret: string, externalId: string, callback: (error: string, success: boolean)=>void):void;
  authenticateToken(profileToken: string, refreshToken: string, callback: (error: string, success: boolean)=>void):void;
  deauthenticate(callback: (error: string, success: boolean)=>void):void;
  getDemographic(callback: (error: string, demographic: Object)=>void):void;
  postDemographic(demographic: Object, callback: (error: string, success: boolean)=>void):void;
  getSensorStatus(callback: (error: string, value: SahhaSensorStatus)=>void):void;
  enableSensors(callback: (error: string, value: SahhaSensorStatus)=>void):void;
  postSensorData(callback: (error: string, success: boolean)=>void):void;
  analyze(callback: (error: string, value: string)=>void):void;
  analyzeDateRange(startDate: number, endDate: number, callback: (error: string, value: string)=>void):void;
  openAppSettings():void;
}

export default Sahha as SahhaInterface;