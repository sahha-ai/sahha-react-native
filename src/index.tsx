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
  gender = 'gender',
  date_of_birth = 'date_of_birth',
  sleep = 'sleep',
  step_count = 'step_count',
  floor_count = 'floor_count',
  heart_rate = 'heart_rate',
  resting_heart_rate = 'resting_heart_rate',
  walking_heart_rate_average = 'walking_heart_rate_average',
  heart_rate_variability_sdnn = 'heart_rate_variability_sdnn',
  heart_rate_variability_rmssd = 'heart_rate_variability_rmssd',
  blood_pressure_systolic = 'blood_pressure_systolic',
  blood_pressure_diastolic = 'blood_pressure_diastolic',
  blood_glucose = 'blood_glucose',
  vo2_max = 'vo2_max',
  oxygen_saturation = 'oxygen_saturation',
  respiratory_rate = 'respiratory_rate',
  active_energy_burned = 'active_energy_burned',
  basal_energy_burned = 'basal_energy_burned',
  total_energy_burned = 'total_energy_burned',
  basal_metabolic_rate = 'basal_metabolic_rate',
  time_in_daylight = 'time_in_daylight',
  body_temperature = 'body_temperature',
  basal_body_temperature = 'basal_body_temperature',
  sleeping_wrist_temperature = 'sleeping_wrist_temperature',
  height = 'height',
  weight = 'weight',
  lean_body_mass = 'lean_body_mass',
  body_mass_index = 'body_mass_index',
  body_fat = 'body_fat',
  body_water_mass = 'body_water_mass',
  bone_mass = 'bone_mass',
  waist_circumference = 'waist_circumference',
  stand_time = 'stand_time',
  move_time = 'move_time',
  exercise_time = 'exercise_time',
  activity_summary = 'activity_summary',
  device_lock = 'device_lock',
  exercise = 'exercise',
}

export enum SahhaSensorStatus {
  pending = 0, /// Sensor data is pending User permission
  unavailable = 1, /// Sensor data is not supported by the User's device
  disabled = 2, /// Sensor data has been disabled by the User
  enabled = 3, /// Sensor data has been enabled by the User
}

export enum SahhaScoreType {
  wellbeing = 'wellbeing',
  activity = 'activity',
  sleep = 'sleep',
  readiness = 'readiness',
  mental_wellbeing = 'mental_wellbeing',
}

const Sahha = NativeModules.SahhaReactNative;

interface SahhaInterface {
  configure(settings: Object, callback: (error: string, success: boolean)=>void):void;
  isAuthenticated(callback: (error: string, success: boolean)=>void):void
  authenticate(appId: string, appSecret: string, externalId: string, callback: (error: string, success: boolean)=>void):void;
  authenticateToken(profileToken: string, refreshToken: string, callback: (error: string, success: boolean)=>void):void;
  deauthenticate(callback: (error: string, success: boolean)=>void):void;
  getProfileToken(callback: (error: string, profileToken?: string)=>void):void;
  getDemographic(callback: (error: string, demographic?: string)=>void):void;
  postDemographic(demographic: Object, callback: (error: string, success: boolean)=>void):void;
  getSensorStatus(sensors: Array<SahhaSensor>, callback: (error: string, value: SahhaSensorStatus)=>void):void;
  enableSensors(sensors: Array<SahhaSensor>, callback: (error: string, value: SahhaSensorStatus)=>void):void;
  getScores(types: Array<SahhaScoreType>, callback: (error: string, value: string)=>void):void;
  getScoresDateRange(types: Array<SahhaScoreType>, startDate: number, endDate: number, callback: (error: string, value: string)=>void):void;
  openAppSettings():void;
}

export default Sahha as SahhaInterface;