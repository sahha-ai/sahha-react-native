#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SahhaReactNative, NSObject)

RCT_EXTERN_METHOD(configure:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(authenticate:(NSString *)profileToken refreshToken:(NSString *)refreshToken callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getDemographic:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postDemographic:(NSDictionary *)demographic callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activate:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(activityStatus:(NSString *)activity callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postSensorData:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(analyze:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(openAppSettings)

@end
