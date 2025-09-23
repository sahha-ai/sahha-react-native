import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  configure(
    settings: { environment: string },
    callback: (error: string, success: boolean) => void
  ): void;
  isAuthenticated(callback: (error: string, success: boolean) => void): void;
  authenticate(
    appId: string,
    appSecret: string,
    externalId: string,
    callback: (error: string, success: boolean) => void
  ): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SahhaReactNative');
