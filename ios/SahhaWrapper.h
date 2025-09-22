#import <Foundation/Foundation.h>
#import <Sahha/Sahha-Swift.h> 

@interface SahhaWrapper : NSObject

+ (void)configureWithSettings:(SahhaSettings *)settings callback:(void (^)(void))callback;

@end