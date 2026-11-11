import type { Spec } from '../NativeSahhaReactNative';

type Index = typeof import('../index');

// Loads src/index.tsx in a fresh module registry, with TurboModuleRegistry
// returning `nativeModule` for SahhaReactNative.
function loadIndex(nativeModule: Spec | null): Index {
  let index = {} as Index;
  jest.isolateModules(() => {
    const {
      TurboModuleRegistry,
    }: typeof import('react-native') = require('react-native');
    jest.spyOn(TurboModuleRegistry, 'get').mockReturnValue(nativeModule);
    index = require('../index');
  });
  return index;
}

describe('the default export', () => {
  it('is the native module when it is linked', () => {
    const nativeModule = { configure: jest.fn() } as unknown as Spec;

    expect(loadIndex(nativeModule).default).toBe(nativeModule);
  });

  describe('when the native module is not linked', () => {
    it('still imports, with the enums', () => {
      const index = loadIndex(null);

      expect(index.default).not.toBeNull();
      expect(index.SahhaEnvironment.sandbox).toBe('sandbox');
    });

    it('throws a linking error when a method is called', () => {
      const { default: Sahha } = loadIndex(null);

      expect(() => Sahha.configure({}, () => {})).toThrow(
        "The package 'sahha-react-native' doesn't seem to be linked."
      );
    });

    it('lets symbol and `then` lookups through', async () => {
      const { default: Sahha } = loadIndex(null);

      expect(Object.prototype.toString.call(Sahha)).toBe('[object Object]');
      await expect(Promise.resolve(Sahha)).resolves.toBe(Sahha);
    });
  });
});
