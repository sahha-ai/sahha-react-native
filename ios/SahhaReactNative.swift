import Foundation
import React
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
  
  @objc func constantsToExport() -> [AnyHashable: Any]! {
    return ["message": "Sahha Demo"]
  }
  
  enum SahhaSettingsIdentifier: String {
    case environment
    case sensors
  }
  
  @objc(configure:callback:)
  func configure(
    _ settings: NSDictionary, callback: @escaping RCTResponseSenderBlock
  ) {
    if let configSettings = settings as? [String: Any],
       let environment = configSettings[
        SahhaSettingsIdentifier.environment.rawValue] as? String,
       let configEnvironment: SahhaEnvironment = SahhaEnvironment(
        rawValue: environment)
    {
      
      var settings = SahhaSettings(environment: configEnvironment)
      settings.framework = .react_native
      
      Sahha.configure(settings) {
        print("Sahha | ReactNative configure success")
        callback([NSNull(), true])
      }
    } else {
      let message = "Sahha configure settings invalid"
      var body = "INVALID"
      if let jsonData = try? JSONSerialization.data(
        withJSONObject: settings, options: [.prettyPrinted]),
         let jsonString = String(data: jsonData, encoding: .utf8)
      {
        body = jsonString
      }
      print("Sahha | ReactNative configure error")
      Sahha.postError(
        framework: .react_native, message: message, path: "SahhaReactNative",
        method: "configure", body: body)
      callback([message, false])
    }
  }

   @objc(openAppSettings)
  func openAppSettings() {
    Sahha.openAppSettings()
  }
  
  @objc(postSensorData)
  func postSensorData() {
    Sahha.postSensorData()
  }

   @objc(isAuthenticated:)
  func isAuthenticated(_ callback: @escaping RCTResponseSenderBlock) {
    callback([NSNull(), Sahha.isAuthenticated])
  }
  
  @objc(authenticate:appSecret:externalId:callback:)
  func authenticate(
    _ appId: String, appSecret: String, externalId: String,
    callback: @escaping RCTResponseSenderBlock
  ) {
    Sahha.authenticate(
      appId: appId, appSecret: appSecret, externalId: externalId
    ) { error, success in
      callback([error ?? NSNull(), success])
    }
  }

    // Add more wrappers similarly, e.g., for Sahha.analyze, Sahha.deauthenticate, Sahha.postDemographic, etc.
}
