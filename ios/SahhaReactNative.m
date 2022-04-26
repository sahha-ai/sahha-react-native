#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SahhaReactNative, NSObject)

RCT_EXTERN_METHOD(configure:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(authenticate:(NSString *)token refreshToken:(NSString *)refreshToken callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getDemographic:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postDemographic:(NSDictionary *)demographic callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activate:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activityStatus:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postActivity:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(multiply:(float)a b:(float)b
                  onSuccess:(RCTPromiseResolveBlock)resolve
                  onFailure:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(add:(RCTPromiseResolveBlock)resolve
                  onFailure:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(speak:(RCTPromiseResolveBlock)resolve
                  onFailure:(RCTPromiseRejectBlock)reject)

@end
