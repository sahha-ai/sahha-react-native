import SwiftUI
import Sahha

@objc(SahhaReactNative)
class SahhaReactNative: NSObject {
    
    enum SahhaActivity: String {
        case motion
        case health
    }
        
    enum SahhaError: Error {
        case woops
    }
    
    var storedValue: Int = 0
    override init() {
        super.init()
    }
    
    @objc static func requiresMainQueueSetup() -> Bool {
      return false
    }
    
    @objc func constantsToExport() -> [AnyHashable : Any]! {
        return ["message": Sahha.text]
    }
    
    @objc(configure)
    func configure() {
        Sahha.configure()
    }
    
    @objc(activate:)
    func activate(callback: @escaping RCTResponseSenderBlock) {
        Sahha.motion.activate { newStatus in
            callback([newStatus.rawValue])
        }
    }
    
    @objc(authenticate:profileId:callback:)
    func authenticate(customerId: String, profileId: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.authenticate(customerId: customerId, profileId: profileId) { error, token in
            callback([error ?? NSNull(), token ?? NSNull()])
        }
    }
    
    @objc(activate:callback:)
    func activate(activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        switch SahhaActivity(rawValue: activity) {
        case .motion:
            Sahha.motion.activate { value in
                callback([NSNull(),value.rawValue])
            }
        case .health:
            Sahha.health.activate { value in
                callback([NSNull(),value.rawValue])
            }
        default:
            callback(["\(activity) is not a valid activity",NSNull()])
        }
    }
    
    @objc(promptUserToActivate:callback:)
    func promptUserToActivate(activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        switch SahhaActivity(rawValue: activity) {
        case .motion:
            Sahha.motion.promptUserToActivate { value in
                callback([NSNull(),value.rawValue])
            }
        case .health:
            Sahha.health.activate { value in
                callback([NSNull(),value.rawValue])
            }
        default:
            callback(["\(activity) is not a valid activity",NSNull()])
        }
    }
    
    @objc(activityStatus:callback:)
    func activityStatus(activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        switch activity {
        case "motion":
            callback([NSNull(), Sahha.motion.activityStatus.rawValue])
        case "health":
            callback([NSNull(), Sahha.health.activityStatus.rawValue])
        default:
            callback(["\(activity) is not a valid activity",NSNull()])
        }
    }
    
    @objc(squareUp:onSuccess:onFailure:)
    func squareUp(value: Int, onSuccess:RCTPromiseResolveBlock, onFailure:RCTPromiseRejectBlock) -> Void {
        //let newValue = Sahha.shared.squareUp(value: value)
        let newValue = 10
        onSuccess(newValue)
    }

    @objc(multiply:b:onSuccess:onFailure:)
    func multiply(a: Float, b: Float, onSuccess:RCTPromiseResolveBlock,onFailure:RCTPromiseRejectBlock) -> Void {
        onSuccess(a*b)
    }
    
    @objc(add:onFailure:)
    func add(onSuccess: RCTPromiseResolveBlock, onFailure: RCTPromiseRejectBlock) -> Void {
        onSuccess(storedValue+storedValue+storedValue)
        //onFailure("Nope!", "Try again!", SahhaError.woops)
    }
    
    @objc(speak:onFailure:)
    func speak(onSuccess: RCTPromiseResolveBlock, onFailure: RCTPromiseRejectBlock) -> Void {
        onSuccess(Sahha.bundleId)
        //onFailure("Nope!", "Try again!", SahhaError.woops)
    }
}
