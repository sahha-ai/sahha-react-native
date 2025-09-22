#import "SahhaReactNative.h"
#import "SahhaWrapper.h"

@implementation SahhaReactNative

RCT_EXPORT_MODULE()

- (NSNumber *)multiply:(double)a b:(double)b {
  NSNumber *result = @(a * b);
  return result;
}

RCT_EXPORT_METHOD(configure:(NSDictionary *)settingsDict resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *envStr = settingsDict[@"environment"];
  SahhaEnvironment env = [envStr isEqualToString:@"production"]
                             ? SahhaEnvironmentProduction
                             : SahhaEnvironmentSandbox;
  SahhaSettings *settings = [[SahhaSettings alloc] initWithEnvironment:env];
  [SahhaWrapper configureWithSettings:settings
                             callback:^{
                               resolve(@YES);
                             }];
  // TODO: Add error handling if Sahha provides error checks.
}

class SahhaReactNativeTurboModule : public facebook::react::NativeSahhaReactNativeSpecJSI {
public:
  SahhaReactNativeTurboModule(const facebook::react::ObjCTurboModule::InitParams &params)
      : facebook::react::NativeSahhaReactNativeSpecJSI(params) {}

  jsi::Value multiply(jsi::Runtime &runtime, double a, double b) override {
    return jsi::Value(a * b);
  }

  void configure(jsi::Runtime &runtime, jsi::Object settingsObj,
                 jsi::Function resolveCallback,
                 jsi::Function rejectCallback) override {
    std::string envStr = settingsObj.getProperty(runtime, "environment")
                             .asString(runtime)
                             .utf8(runtime);
    SahhaEnvironment env = (envStr == "production") ? SahhaEnvironmentProduction
                                                    : SahhaEnvironmentSandbox;
    SahhaSettings *settings = [[SahhaSettings alloc] initWithEnvironment:env];
    [SahhaWrapper configureWithSettings:settings
                               callback:^{
                                 resolveCallback.call(runtime, jsi::Value(true));
                               }];
    // TODO: For errors, call rejectCallback if applicable.
  }
};

// In getTurboModule:
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<SahhaReactNativeTurboModule>(params);
}

@end