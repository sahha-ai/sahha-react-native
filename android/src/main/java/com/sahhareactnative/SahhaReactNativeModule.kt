package com.sahhareactnative

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.google.gson.Gson
import sdk.sahha.android.source.*

class SahhaReactNativeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "SahhaReactNative"
  }

  @ReactMethod
  fun configure(settings: ReadableMap, callback: Callback) {

    var environment: String? = settings.getString("environment")
    if (environment == null) {
      callback.invoke("Sahha.configure() environment parameter is missing", null)
      return
    }
    var sahhaEnvironment: SahhaEnvironment
    try {
      sahhaEnvironment = SahhaEnvironment.valueOf(environment)
    } catch (e: IllegalArgumentException) {
      callback.invoke("Sahha.configure() environment parameter is not valid", null)
      return
    }
    var postSensorDataManually: Boolean = false
    if (settings.hasKey("postSensorDataManually")) {
      postSensorDataManually = settings.getBoolean("postSensorDataManually")
    }

    var sensors: ReadableArray? = settings.getArray("sensors")

    var sahhaSettings: SahhaSettings

    if (sensors == null) {
      sahhaSettings = SahhaSettings(
        sahhaEnvironment,
        SahhaFramework.react_native,
        postSensorDataManually = postSensorDataManually
      )
    } else {
      var sahhaSensors: MutableSet<SahhaSensor> = mutableSetOf()
      try {
        sensors.toArrayList().forEach {
          var sensor = SahhaSensor.valueOf(it as String)
          sahhaSensors.add(sensor)
        }
        sahhaSettings = SahhaSettings(
          sahhaEnvironment,
          SahhaFramework.react_native,
          sahhaSensors,
          postSensorDataManually
        )
      } catch (e: IllegalArgumentException) {
        callback.invoke("Sahha.configure() sensor parameter is not valid", null)
        return
      }
    }
    var app = currentActivity?.application

    if (app == null) {
      callback("Sahha.configure() application parameter is null", false)
    } else {
      Sahha.configure(app, sahhaSettings)
      callback(null, true)
    }
  }

  @ReactMethod
  fun authenticate(profileToken: String, refreshToken: String, callback: Callback) {

    Sahha.authenticate(profileToken, refreshToken) { error, success ->
      if (error != null) {
        callback(error, false)
      } else {
        callback(null, success)
      }
    }
  }

  @ReactMethod
  fun getDemographic(callback: Callback) {

    Sahha.getDemographic() { error, demographic ->
      if (error != null) {
        callback.invoke(error, null)
      } else if (demographic != null) {
        val gson = Gson()
        val demographicJson: String = gson.toJson(demographic)
        Log.d("Sahha", demographicJson)
        callback.invoke(null, demographicJson)
      } else {
        callback.invoke("Sahha Error", "Sahha Demographic not available", null)
      }
    }
  }

  @ReactMethod
  fun postDemographic(demographic: ReadableMap, callback: Callback) {

    val age: Int? = demographic.getInt("age")
    val gender: String? = demographic.getString("gender")
    val country: String? = demographic.getString("country")
    val birthCountry: String? = demographic.getString("birthCountry")
    var sahhaDemographic = SahhaDemographic(age, gender, country, birthCountry)

    Sahha.postDemographic(sahhaDemographic) { error, success ->
      if (error != null) {
        callback.invoke(error, null)
      } else {
        callback.invoke(null, success)
      }
    }
  }

  @ReactMethod
  fun getSensorStatus(sensor: String, callback: Callback) {

    try {
      var sahhaSensor = SahhaSensor.valueOf(sensor)
      Sahha.getSensorStatus(
        reactApplicationContext.baseContext,
        sahhaSensor
      ) { error, sensorStatus ->
        if (error != null) {
          callback.invoke(error, null)
        } else {
          callback.invoke(null, sensorStatus.ordinal)
        }
      }
    } catch (e: IllegalArgumentException) {
      callback.invoke("Sahha sensor parameter is not valid", null)
    }
  }

  @ReactMethod
  fun enableSensor(sensor: String, callback: Callback) {

    try {
      var sahhaSensor = SahhaSensor.valueOf(sensor)
      Sahha.enableSensor(reactApplicationContext.baseContext, sahhaSensor) { error, sensorStatus ->
        if (error != null) {
          callback.invoke(error, null)
        } else {
          callback.invoke(null, sensorStatus.ordinal)
        }
      }
    } catch (e: IllegalArgumentException) {
      callback.invoke("Sahha sensor parameter is not valid", null)
    }
  }

  @ReactMethod
  fun postSensorData(settings: ReadableMap, callback: Callback) {

    var sensors: ReadableArray? = settings.getArray("sensors")
    if (sensors == null) {
      Sahha.postSensorData { error, success ->
        if (error != null) {
          callback.invoke(error, null)
        } else {
          callback.invoke(null, success)
        }
      }
      return
    }
    var sahhaSensors: MutableSet<SahhaSensor> = mutableSetOf()
    try {
      sensors.toArrayList().forEach {
        var sensor = SahhaSensor.valueOf(it as String)
        sahhaSensors.add(sensor)
      }
      Sahha.postSensorData(sahhaSensors) { error, success ->
        if (error != null) {
          callback.invoke(error, null)
        } else {
          callback.invoke(null, success)
        }
      }
    } catch (e: IllegalArgumentException) {
      callback.invoke("Sahha.postSensorData() sensor parameter is not valid", null)
      return
    }

    callback.invoke(null, true)
  }

  @ReactMethod
  fun analyze(settings: ReadableMap, callback: Callback) {

    val startDate: String? = settings.getString("startDate")
    if (startDate != null) {
      Log.d("Sahha", "startDate $startDate")
    } else {
      Log.d("Sahha", "startDate missing")
    }

    val endDate: String? = settings.getString("endDate")
    if (endDate != null) {
      Log.d("Sahha", "endDate $endDate")
    } else {
      Log.d("Sahha", "endDate missing")
    }

    Sahha.analyze() { error, value ->
      if (error != null) {
        callback.invoke(error, null)
      } else if (value != null) {
        callback.invoke(null, value)
      } else {
        callback.invoke("Sahha.analyze() failed", null)
      }
    }
  }

  @ReactMethod
  fun openAppSettings() {
    Sahha.openAppSettings(reactApplicationContext.baseContext)
  }
}
