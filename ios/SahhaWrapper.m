#import "SahhaWrapper.h"

@implementation SahhaWrapper

+ (void)configureWithSettings:(SahhaSettings *)settings callback:(void (^)(void))callback {
    [Sahha configure:settings callback:callback];
}

@end