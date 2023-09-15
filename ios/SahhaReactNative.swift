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
        return ["message": "Sahha Demo"]
    }

    enum SahhaSettingsIdentifier: String {
        case environment
        case sensors
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

            var settings = SahhaSettings(environment: configEnvironment, sensors: configSensors)
            settings.framework = .react_native

            Sahha.configure(settings) {
                print("Sahha | ReactNative configured")
                callback([NSNull(), true])
            }
        } else {
            let message = "Sahha configure settings invalid"
            var body = "INVALID"
            if let jsonData = try? JSONSerialization.data(withJSONObject: settings, options: [.prettyPrinted]), let jsonString = String(data: jsonData, encoding: .utf8) {
                body = jsonString
            }
            Sahha.postError(framework: .react_native, message: message, path: "SahhaReactNative", method: "configure", body: body)
            callback([message, false])
        }
    }

    @objc(openAppSettings)
    func openAppSettings() -> Void {
        Sahha.openAppSettings()
    }

    @objc(isAuthenticated:)
    func isAuthenticated(_ callback: @escaping RCTResponseSenderBlock) {
        callback([NSNull(), Sahha.isAuthenticated])
    }
    
    @objc(authenticate:appSecret:externalId:callback:)
    func authenticate(_ appId: String, appSecret: String, externalId: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.authenticate(appId: appId, appSecret: appSecret, externalId: externalId) { error, success in
            callback([error ?? NSNull(), success])
        }
    }
    
    @objc(authenticateToken:refreshToken:callback:)
    func authenticateToken(_ profileToken: String, refreshToken: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.authenticate(profileToken: profileToken, refreshToken: refreshToken) { error, success in
            callback([error ?? NSNull(), success])
        }
    }

    @objc(deauthenticate:)
    func deauthenticate(_ callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.deauthenticate { error, success in
            callback([error ?? NSNull(), success])
        }
    }

    @objc(getDemographic:)
    func getDemographic(_ callback: @escaping RCTResponseSenderBlock) {
        Sahha.getDemographic { error, value in
            var string: String?
            if let value = value {
                do {
                    let jsonEncoder = JSONEncoder()
                    jsonEncoder.outputFormatting = .prettyPrinted
                    let jsonData = try jsonEncoder.encode(value)
                    string = String(data: jsonData, encoding: .utf8)
                } catch let encodingError {
                    print(encodingError)
                    Sahha.postError(framework: .react_native, message: encodingError.localizedDescription, path: "SahhaReactNative", method: "getDemographic", body: "if let value = value")
                    callback([encodingError.localizedDescription, NSNull()])
                    return
                }
            }
            callback([error ?? NSNull(), string ?? NSNull()])
        }
    }

    @objc(postDemographic:callback:)
    func postDemographic(_ demographic: NSDictionary, callback: @escaping RCTResponseSenderBlock) {
        if let configDemographic = demographic as? [String: Any] {

            var requestDemographic = SahhaDemographic()

            if let ageNumber = configDemographic["age"] as? NSNumber {
                let age = ageNumber.intValue
                requestDemographic.age = age
            }

            if let gender = configDemographic["gender"] as? String {
                requestDemographic.gender = gender
            }

            if let country = configDemographic["country"] as? String {
                requestDemographic.country = country
            }

            if let birthCountry = configDemographic["birthCountry"] as? String {
                requestDemographic.birthCountry = birthCountry
            }

            if let ethnicity = configDemographic["ethnicity"] as? String {
                requestDemographic.ethnicity = ethnicity
            }

            if let occupation = configDemographic["occupation"] as? String {
                requestDemographic.occupation = occupation
            }

            if let industry = configDemographic["industry"] as? String {
                requestDemographic.industry = industry
            }

            if let incomeRange = configDemographic["incomeRange"] as? String {
                requestDemographic.incomeRange = incomeRange
            }

            if let education = configDemographic["education"] as? String {
                requestDemographic.education = education
            }

            if let relationship = configDemographic["relationship"] as? String {
                requestDemographic.relationship = relationship
            }

            if let locale = configDemographic["locale"] as? String {
                requestDemographic.locale = locale
            }

            if let livingArrangement = configDemographic["livingArrangement"] as? String {
                requestDemographic.livingArrangement = livingArrangement
            }
            
            if let birthDate = configDemographic["birthDate"] as? String {
                requestDemographic.birthDate = birthDate
            }

            Sahha.postDemographic(requestDemographic) { error, success in
                callback([error ?? NSNull(), success])
            }

        } else {
            let message = "Sahha demographic invalid"
            var body = "INVALID"
            if let jsonData = try? JSONSerialization.data(withJSONObject: demographic, options: [.prettyPrinted]), let jsonString = String(data: jsonData, encoding: .utf8) {
                body = jsonString
            }
            Sahha.postError(framework: .react_native, message: message, path: "SahhaReactNative", method: "postDemographic", body: body)
            callback([message, false])
        }
    }
    
    @objc(getSensorStatus:)
    func getSensorStatus(_ callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.getSensorStatus { error, sensorStatus in
            callback([error ?? NSNull(), sensorStatus.rawValue])
        }
    }
    
    @objc(enableSensors:)
    func enableSensors(_ callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.enableSensors { error, sensorStatus in
            callback([error ?? NSNull(), sensorStatus.rawValue])
        }
    }

    @objc(postSensorData:)
    func postSensorData(_ callback: @escaping RCTResponseSenderBlock) {
        Sahha.postSensorData { error, success in
            callback([error ?? NSNull(), success])
        }
    }

    @objc(analyze:)
    func analyze(callback: @escaping RCTResponseSenderBlock) -> Void {
        Sahha.analyze { error, value in
            callback([error ?? NSNull(), value ?? NSNull()])
        }
    }
    
    @objc(analyzeDateRange:endDate:callback:)
    func analyzeDateRange(_ startDate: NSNumber, endDate: NSNumber, callback: @escaping RCTResponseSenderBlock) -> Void {
        let startDateTimeInterval = TimeInterval(startDate.doubleValue / 1000)
        let endDateTimeInterval = TimeInterval(endDate.doubleValue / 1000)
        guard startDateTimeInterval > 0, endDateTimeInterval > 0 else {
            let message = "Sahha analyze date range invalid"
            Sahha.postError(framework: .react_native, message: message, path: "SahhaReactNative", method: "analyzeDateRange", body: "\(startDate.stringValue) | \(endDate.stringValue)")
            callback([message, NSNull()])
            return
        }
        let startDate = Date(timeIntervalSince1970: startDateTimeInterval)
        let endDate = Date(timeIntervalSince1970: endDateTimeInterval)
        let dates:(startDate: Date, endDate: Date) = (startDate, endDate)
        Sahha.analyze(dates: dates) { error, value in
            callback([error ?? NSNull(), value ?? NSNull()])
        }
    }

}
