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
        case postSensorDataManually
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

            let postSensorDataManually: Bool? = configSettings[SahhaSettingsIdentifier.postSensorDataManually.rawValue] as? Bool

            var settings = SahhaSettings(environment: configEnvironment, sensors: configSensors, postSensorDataManually: postSensorDataManually)
            settings.framework = .react_native

            Sahha.configure(settings)

            // Needed for React Native since native iOS lifecycle is delayed at launch
            Sahha.launch()

            callback([NSNull(), true])
        } else {
            callback(["Sahha settings are invalid", false])
        }
    }

    @objc(openAppSettings)
    func openAppSettings() -> Void {
        Sahha.openAppSettings()
    }

    @objc(authenticate:refreshToken:callback:)
    func authenticate(_ profileToken: String, refreshToken: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        let success = Sahha.authenticate(profileToken: profileToken, refreshToken: refreshToken)
        callback([success ? NSNull() : "Sahha.authenticate() credentials are not valid", success])
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
                //requestDemographic.ethnicity = ethnicity
            }

            if let occupation = configDemographic["occupation"] as? String {
                //requestDemographic.occupation = occupation
            }

            if let industry = configDemographic["industry"] as? String {
                //requestDemographic.industry = industry
            }

            if let incomeRange = configDemographic["incomeRange"] as? String {
                //requestDemographic.incomeRange = incomeRange
            }

            if let education = configDemographic["education"] as? String {
                //requestDemographic.education = education
            }

            if let relationship = configDemographic["relationship"] as? String {
                //requestDemographic.relationship = relationship
            }

            if let locale = configDemographic["locale"] as? String {
                //requestDemographic.locale = locale
            }

            if let livingArrangement = configDemographic["livingArrangement"] as? String {
                //requestDemographic.livingArrangement = livingArrangement
            }

            Sahha.postDemographic(requestDemographic) { error, success in
                callback([error ?? NSNull(), success])
            }

        } else {
            callback(["Sahha demographic not valid", false])
        }
    }
    
    @objc(getSensorStatus:callback:)
    func getSensorStatus(_ sensor: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        if let sahhaSensor = SahhaSensor(rawValue: sensor) {
            Sahha.getSensorStatus(sahhaSensor) { sensorStatus in
                callback([NSNull(),sensorStatus.rawValue])
            }
        } else {
            callback(["\(sensor) is not a valid Sahha Sensor",NSNull()])
        }
    }

    @objc(enableSensor:callback:)
    func enableSensor(_ sensor: String, callback: @escaping RCTResponseSenderBlock) -> Void {
        if let sahhaSensor = SahhaSensor(rawValue: sensor) {
            Sahha.enableSensor(sahhaSensor) { sensorStatus in
                callback([NSNull(),sensorStatus.rawValue])
            }
        } else {
            callback(["\(sensor) is not a valid Sahha Sensor",NSNull()])
        }
    }

    @objc(postSensorData:callback:)
    func postSensorData(_ settings: NSDictionary, callback: @escaping RCTResponseSenderBlock) {

        if let configSettings = settings as? [String: Any] {
            if let sensors = configSettings[SahhaSettingsIdentifier.sensors.rawValue] as? [String] {
                var sahhaSensors: Set<SahhaSensor> = []
                for sensor in sensors {
                    if let sahhaSensor = SahhaSensor(rawValue: sensor) {
                        sahhaSensors.insert(sahhaSensor)
                    } else {
                        callback(["\(sensor) is not a valid Sahha Sensor", false])
                        return
                    }
                }
                if sahhaSensors.isEmpty {
                    callback(["Sahha Sensors parameter is empty", false])
                } else {
                    Sahha.postSensorData(sahhaSensors) { error, success in
                        if let error = error {
                            callback([error, false])
                        } else {
                            callback([NSNull(), success])
                        }
                    }
                }
            }

        } else {
            callback(["Sahha.postSensorData() settings are not valid", false])
        }
    }

    @objc(analyze:callback:)
    func analyze(_ settings: NSDictionary, callback: @escaping RCTResponseSenderBlock) -> Void {
        var dates: (startDate: Date, endDate: Date)?
        if let configSettings = settings as? [String: Any], let startDateNumber = configSettings["startDate"] as? NSNumber, let endDateNumber = configSettings["endDate"] as? NSNumber {
            let startDate = Date(timeIntervalSince1970: TimeInterval(startDateNumber.doubleValue / 1000))
            let endDate = Date(timeIntervalSince1970: TimeInterval(endDateNumber.doubleValue / 1000))
            print("startDate", startDate.toTimezoneFormat)
            print("endDate", endDate.toTimezoneFormat)
            dates = (startDate, endDate)
            print(startDate, endDate)
        } else {
            print("no dates")
        }
        Sahha.analyze(dates: dates) { error, value in
            callback([error ?? NSNull(), value ?? NSNull()])
        }
    }
}
