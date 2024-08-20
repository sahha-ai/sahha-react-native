package com.sahhareactnative

import android.util.Log
import com.facebook.react.bridge.*
import com.google.gson.Gson
import sdk.sahha.android.source.*
import java.time.LocalDateTime
import java.util.*

class SahhaReactNativeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "SahhaReactNative"
  }

  @ReactMethod
  fun configure(settings: ReadableMap, callback: Callback) {

    var environment: String? = settings.getString("environment")
    if (environment == null) {
      // Sahha.postError()
      callback.invoke("Sahha.configure() environment parameter is missing", null)
      return
    }
    var sahhaEnvironment: SahhaEnvironment
    try {
      sahhaEnvironment = SahhaEnvironment.valueOf(environment)
    } catch (e: IllegalArgumentException) {
      // Sahha.postError()
      callback.invoke("Sahha.configure() environment parameter is invalid", null)
      return
    }

    // Notification config
    var sahhaNotificationConfiguration: SahhaNotificationConfiguration? = null
    try {
      settings.getMap("notificationSettings")?.also { nSettings ->
        val icon = nSettings.getString("icon")
        val title = nSettings.getString("title")
        val shortDescription = nSettings.getString("shortDescription")

        sahhaNotificationConfiguration = SahhaNotificationConfiguration(
          SahhaConverterUtility.stringToDrawableResource(
            reactApplicationContext,
            icon
          ),
          title,
          shortDescription,
        )
      }
    } catch (e: IllegalArgumentException) {
      // Sahha.postError()
      callback.invoke("Sahha.configure() notification config is invalid", null)
      return
    }
    // Notification config ends

    var sahhaSettings: SahhaSettings = SahhaSettings(
        environment = sahhaEnvironment,
        notificationSettings = sahhaNotificationConfiguration,
        framework = SahhaFramework.react_native
      )

    var app = currentActivity?.application

    if (app == null) {
      callback("Sahha.configure() application parameter is null", false)
    } else {
      Sahha.configure(app, sahhaSettings) { error, success ->
        callback(error, success)
      }
    }
  }

  @ReactMethod
  fun isAuthenticated(callback: Callback) {
    callback(null, Sahha.isAuthenticated)
  }

  @ReactMethod
  fun authenticate(appId: String, appSecret: String, externalId: String, callback: Callback) {

    Sahha.authenticate(appId, appSecret, externalId) { error, success ->
      callback(error, success)
    }
  }

  @ReactMethod
  fun authenticateToken(profileToken: String, refreshToken: String, callback: Callback) {

    Sahha.authenticate(profileToken, refreshToken) { error, success ->
      callback(error, success)
    }
  }

  @ReactMethod
  fun deauthenticate(callback: Callback) {

    Sahha.deauthenticate { error, success ->
      callback(error, success)
    }
  }

  @ReactMethod
  fun getProfileToken(callback: Callback) {
    callback.invoke(null, Sahha.profileToken)
  }

  @ReactMethod
  fun getDemographic(callback: Callback) {

    Sahha.getDemographic { error, demographic ->
      if (error != null) {
        callback.invoke(error, null)
      } else if (demographic != null) {
        val gson = Gson()
        val demographicJson: String = gson.toJson(demographic)
        Log.d("Sahha", demographicJson)
        callback.invoke(null, demographicJson)
      } else {
        callback.invoke(null, null)
      }
    }
  }

  @ReactMethod
  fun postDemographic(demographic: ReadableMap, callback: Callback) {

    val age: Int? = demographic.getInt("age")
    val gender: String? = demographic.getString("gender")
    val country: String? = demographic.getString("country")
    val birthCountry: String? = demographic.getString("birthCountry")
    val ethnicity: String? = demographic.getString("ethnicity")
    val occupation: String? = demographic.getString("occupation")
    val industry: String? = demographic.getString("industry")
    val incomeRange: String? = demographic.getString("incomeRange")
    val education: String? = demographic.getString("education")
    val relationship: String? = demographic.getString("relationship")
    val locale: String? = demographic.getString("locale")
    val livingArrangement: String? = demographic.getString("livingArrangement")
    val birthDate: String? = demographic.getString("birthDate")
    var sahhaDemographic = SahhaDemographic(
      age,
      gender,
      country,
      birthCountry,
      ethnicity,
      occupation,
      industry,
      incomeRange,
      education,
      relationship,
      locale,
      livingArrangement,
      birthDate
    )

    Sahha.postDemographic(sahhaDemographic) { error, success ->
      callback.invoke(error, success)
    }
  }

  @ReactMethod
  fun getSensorStatus(sensors: ReadableArray, callback: Callback) {
    val sahhaSensors = sensors.toArrayList().map { SahhaSensor.valueOf(it as String) }.toSet()
    Sahha.getSensorStatus(
      reactApplicationContext.baseContext,
      sahhaSensors
    ) { error, sensorStatus ->
      callback.invoke(error, sensorStatus.ordinal)
    }
  }

  @ReactMethod
  fun enableSensors(sensors: ReadableArray, callback: Callback) {
    val sahhaSensors = sensors.toArrayList().map { SahhaSensor.valueOf(it as String) }.toSet()
    Sahha.enableSensors(reactApplicationContext.baseContext, sahhaSensors) { error, sensorStatus ->
      callback.invoke(error, sensorStatus.ordinal)
    }
  }

  @ReactMethod
  fun analyze(callback: Callback) {

    Sahha.analyze { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.analyze() failed"
        Sahha.postError(SahhaFramework.react_native, message, "SahhaReactNativeModule", "analyze")
        callback.invoke(message, null)
      } else {
        callback.invoke(error, value)
      }
    }
  }

  @ReactMethod
  fun analyzeDateRange(startDate: Double, endDate: Double, callback: Callback) {

    val sahhaStartDate: Date
    val sahhaEndDate: Date
    var body: String = "startDate: $startDate | endDate: $endDate"

    try {
      sahhaStartDate = Date(startDate.toLong())
      sahhaEndDate = Date(endDate.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.analyzeDateRange() parameters invalid"
      Sahha.postError(
        SahhaFramework.react_native,
        message,
        "SahhaReactNativeModule",
        "analyzeDateRange",
        body
      )
      callback.invoke(message, null)
      return
    }

    Log.d("Sahha", "analyze startDate $sahhaStartDate")
    Log.d("Sahha", "analyze endDate $sahhaEndDate")
    Sahha.analyze(Pair(sahhaStartDate, sahhaEndDate)) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.analyzeDateRange() failed"
        body =
          "startDate: $startDate | endDate: $endDate | startDate: $sahhaStartDate | endDate: $sahhaEndDate"
        Sahha.postError(
          SahhaFramework.react_native,
          message,
          "SahhaReactNativeModule",
          "analyzeDateRange",
          body
        )
        callback.invoke(message, null)
      } else {
        callback.invoke(error, value)
      }
    }
  }

  @ReactMethod
  fun openAppSettings() {
    Sahha.openAppSettings(reactApplicationContext.baseContext)
  }
}
