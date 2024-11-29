#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SahhaReactNative, NSObject)

RCT_EXTERN_METHOD(configure:(NSDictionary *)settings callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(isAuthenticated:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(authenticate:(NSString *)appId appSecret:(NSString *)appSecret externalId:(NSString *)externalId callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(authenticateToken:(NSString *)profileToken refreshToken:(NSString *)refreshToken callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(deauthenticate:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getProfileToken:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getDemographic:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(postDemographic:(NSDictionary *)demographic callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getSensorStatus:(NSArray *)sensors callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(enableSensors:(NSArray *)sensors callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getScores:(NSArray *)types callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getScoresDateRange:(NSArray *)types startDate:(nonnull NSNumber *)startDate endDate:(nonnull NSNumber *)endDate  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getBiomarkers: (NSArray *)categories types:(NSArray *)types callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(getBiomarkersDateRange: (NSArray *)categories types:(NSArray *)types startDate:(nonnull NSNumber *)startDate endDate:(nonnull NSNumber *)endDate  callback:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(openAppSettings)

@end
