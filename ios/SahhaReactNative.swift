import SwiftUI
import Sahha

@objc(SahhaReactNative)
class SahhaReactNative: NSObject {
    
    var storedValue: Int = 0
    override init() {
        super.init()
    }
    
    @objc static func requiresMainQueueSetup() -> Bool {
      return false
    }
    
    @objc func constantsToExport() -> [AnyHashable : Any]! {
        return ["message": "how are you?"]
    }
    
    enum SahhaSettingsIdentifier: String {
        case environment
        case sensors
        case postActivityManually
    }
    
    @objc(configure:callback:)
    func configure(_ settings: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
                
        if let configSettings = settings as? [String: Any], let environment = configSettings[SahhaSettingsIdentifier.environment.rawValue] as? String, let configEnvironment: SahhaEnvironment = SahhaEnvironment(rawValue: environment) {
            
            var configSensors: Set<SahhaSensor>? = []
            if let sensors = configSettings[SahhaSettingsIdentifier.sensors.rawValue] as? [String] {
                for sensor in sensors {
                    if let configSensor = SahhaSensor(rawValue: sensor) {
                        configSensors?.insert(configSensor)
                    }
                }
            } else {
                configSensors = nil
            }
            
            let postActivityManually: Bool? = configSettings[SahhaSettingsIdentifier.postActivityManually.rawValue] as? Bool
            
            var settings = SahhaSettings(environment: configEnvironment, sensors: configSensors, postActivityManually: postActivityManually)
            settings.framework = .react_native
            
            Sahha.configure(settings)
            
            // Needed for React Native since native iOS lifecycle is delayed at launch
            Sahha.launch()
            
            callback([NSNull(), true])
        } else {
            callback(["Sahha settings are invalid", false])
        }
    }
    
    @objc(postDemographic:callback:)
    func postDemographic(_ demographic: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
        
                
        if let configDemographic = demographic as? [String: Any] {
            
            var requestDemographic = SahhaDemographic()
            
            if let ageString = configDemographic["age"] as? NSString {
                let age = ageString.integerValue
                print("age ", age)
                requestDemographic.age = age
            }
            
            if let gender = configDemographic["gender"] as? String {
                print("gender ", gender)
                requestDemographic.gender = gender
            }
            
            if let country = configDemographic["country"] as? String {
                print("country ", country)
                requestDemographic.country = country
            }
            
            if let birthCountry = configDemographic["birthCountry"] as? String {
                print("birthCountry ", birthCountry)
                requestDemographic.birthCountry = birthCountry
            }
            
            Sahha.postDemographic(requestDemographic) { error, success in
                callback([error ?? NSNull(), success])
            }
            
        } else {
            callback(["Sahha demographic not valid", false])
        }
    }
    
    @objc(activate:)
    func activate(_ callback: @escaping RCTResponseSenderBlock) {
        Sahha.motion.activate { newStatus in
            callback([newStatus.rawValue])
        }
    }
    
    @objc(authenticate:refreshToken:callback:)
    func authenticate(_ token: String, refreshToken: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        let success = Sahha.authenticate(token: token, refreshToken: refreshToken)
        callback([success ? NSNull() : "Sahha credentials not valid", success])
    }
    
    @objc(activate:callback:)
    func activate(_ activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
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
            callback(["\(activity) is not a valid Sahha activity",NSNull()])
        }
    }
    
    @objc(promptUserToActivate:callback:)
    func promptUserToActivate(_ activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
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
            callback(["\(activity) is not a valid Sahha activity",NSNull()])
        }
    }
    
    @objc(activityStatus:callback:)
    func activityStatus(_ activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        switch SahhaActivity(rawValue: activity) {
        case .motion:
            callback([NSNull(), Sahha.motion.activityStatus.rawValue])
        case .health:
            callback([NSNull(), Sahha.health.activityStatus.rawValue])
        default:
            callback(["\(activity) is not a valid Sahha activity",NSNull()])
        }
    }
    
    @objc(postActivity:callback:)
    func postActivity(_ activity: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        switch SahhaActivity(rawValue: activity) {
        case .motion:
            Sahha.motion.postActivity { error, success in
                callback([error ?? NSNull(), success])
            }
        case .health:
            Sahha.health.postActivity { error, success in
                callback([error ?? NSNull(), success])
            }
        default:
            callback(["\(activity) is not a valid Sahha activity", false])
        }
    }
    
    @objc(analyze:)
    func analyze(_ callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.analyze { error, value in
            callback([error ?? NSNull(), value ?? NSNull()])
        }
    }
    
    @objc(openAppSettings)
    func openAppSettings() -> Void {
        Sahha.openAppSettings()
    }
    
    @objc(speak:onFailure:)
    func speak(_ onSuccess: RCTPromiseResolveBlock, onFailure: RCTPromiseRejectBlock) -> Void {
        onSuccess("hello")
        //onFailure("Nope!", "Try again!", SahhaError.woops)
    }
}
