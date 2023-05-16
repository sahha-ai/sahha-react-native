#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SahhaReactNative, NSObject)

RCT_EXTERN_METHOD(configure:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(authenticate:(NSString *)appId appSecret:(NSString *)appSecret externalId:(NSString *)externalId callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getDemographic:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postDemographic:(NSDictionary *)demographic callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getSensorStatus:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(enableSensors:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postSensorData:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(analyze:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(openAppSettings)

@end
