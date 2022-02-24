import SwiftUI
import Sahha

@objc(SahhaReactNative)
class SahhaReactNative: NSObject {
        
    enum SahhaError: Error {
        case woops
    }
    
    var storedValue: Int = 0
    override init() {
        super.init()
        storedValue = 1
        Sahha.shared.setup()
    }
    
    @objc static func requiresMainQueueSetup() -> Bool {
      return false
    }
    
    @objc func constantsToExport() -> [AnyHashable : Any]! {
        return ["message": Sahha.shared.text]
    }
    
    @objc(squareUp:onSuccess:onFailure:)
    func squareUp(value: Int, onSuccess:RCTPromiseResolveBlock,onFailure:RCTPromiseRejectBlock) -> Void {
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
        onSuccess(Sahha.shared.getBundleId())
        //onFailure("Nope!", "Try again!", SahhaError.woops)
    }
}
