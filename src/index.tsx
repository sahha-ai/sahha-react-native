import { Platform } from 'react-native';
import NativeSahhaReactNative, { type Spec } from './NativeSahhaReactNative';

export * from './NativeSahhaReactNative';

const LINKING_ERROR =
  "The package 'sahha-react-native' doesn't seem to be linked. Make sure:\n\n" +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

/**
 * The Sahha SDK.
 *
 * If the native module isn't linked into the app, importing the package still
 * works, but calling any method throws an error explaining how to fix it.
 */
const Sahha: Spec =
  NativeSahhaReactNative ??
  new Proxy({} as Spec, {
    get(_target, property) {
      // Symbol and `then` lookups come from runtime probes (Promise
      // resolution, Object.prototype.toString, Jest automocks) rather than
      // calls into the SDK, so they see an empty object instead of an error.
      if (typeof property === 'symbol' || property === 'then') {
        return undefined;
      }
      throw new Error(LINKING_ERROR);
    },
  });

export default Sahha;
