#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SahhaReactNative, NSObject)

RCT_EXTERN_METHOD(configure:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postDemographic:(NSDictionary *)demographic callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activate:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(authenticate:(NSString *)customerId profileId:(NSString *)profileId callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activate:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(promptUserToActivate:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activityStatus:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postActivity:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(analyze:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(openAppSettings)

RCT_EXTERN_METHOD(speak:(RCTPromiseResolveBlock)resolve
                  onFailure:(RCTPromiseRejectBlock)reject)

@end
