package com.sahhareactnative

import android.util.Log
import androidx.activity.ComponentActivity
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.JsonPrimitive
import com.google.gson.JsonSerializer
import sdk.sahha.android.source.Sahha
import sdk.sahha.android.source.SahhaBiomarkerCategory
import sdk.sahha.android.source.SahhaBiomarkerType
import sdk.sahha.android.source.SahhaConverterUtility
import sdk.sahha.android.source.SahhaDemographic
import sdk.sahha.android.source.SahhaEnvironment
import sdk.sahha.android.source.SahhaFramework
import sdk.sahha.android.source.SahhaNotificationConfiguration
import sdk.sahha.android.source.SahhaScoreType
import sdk.sahha.android.source.SahhaSensor
import sdk.sahha.android.source.SahhaSettings
import java.time.ZonedDateTime
import java.util.Date

class SahhaReactNativeModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "SahhaReactNative"
  }

  @ReactMethod
  fun configure(settings: ReadableMap, callback: Callback) {

    val environment: String? = settings.getString("environment")
    if (environment == null) {
      // Sahha.postError()
      callback.invoke("Sahha.configure() environment parameter is missing", null)
      return
    }
    val sahhaEnvironment: SahhaEnvironment
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

    val sahhaSettings: SahhaSettings = SahhaSettings(
      environment = sahhaEnvironment,
      notificationSettings = sahhaNotificationConfiguration,
      framework = SahhaFramework.react_native
    )

    val activity = currentActivity as? ComponentActivity

    if (activity == null) {
      callback("Sahha.configure() activity parameter is null", false)
    } else {
      Sahha.configure(activity, sahhaSettings) { error, success ->
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
    val age: Int? = if (demographic.hasKey("age")) demographic.getInt("age") else null
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
  fun getScores(
    types: ReadableArray,
    startDate: Double,
    endDate: Double,
    callback: Callback,
  ) {
    val sahhaScoreTypes = types.toArrayList().map { SahhaScoreType.valueOf(it as String) }.toSet()

    val sahhaStartDate: Date
    val sahhaEndDate: Date
    var body: String = "startDate: $startDate | endDate: $endDate"

    try {
      sahhaStartDate = Date(startDate.toLong())
      sahhaEndDate = Date(endDate.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.getScores() parameters invalid"
      Sahha.postError(
        SahhaFramework.react_native,
        message,
        "SahhaReactNativeModule",
        "getScores",
        body
      )
      callback.invoke(message, null)
      return
    }

    Log.d("Sahha", "getScores startDate $sahhaStartDate")
    Log.d("Sahha", "getScores endDate $sahhaEndDate")
    Sahha.getScores(sahhaScoreTypes, Pair(sahhaStartDate, sahhaEndDate)) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getScores() failed"
        body =
          "startDate: $startDate | endDate: $endDate | startDate: $sahhaStartDate | endDate: $sahhaEndDate"
        Sahha.postError(
          SahhaFramework.react_native,
          message,
          "SahhaReactNativeModule",
          "getScores",
          body
        )
        callback.invoke(message, null)
      } else {
        callback.invoke(error, value)
      }
    }
  }

  @ReactMethod
  fun getBiomarkers(
    categories: ReadableArray,
    types: ReadableArray,
    startDate: Double,
    endDate: Double,
    callback: Callback,
  ) {
    val sahhaBiomarkerCategories =
      categories.toArrayList().map { SahhaBiomarkerCategory.valueOf(it as String) }.toSet()
    val sahhaBiomarkerTypes =
      types.toArrayList().map { SahhaBiomarkerType.valueOf(it as String) }.toSet()
    val sahhaStartDate: Date
    val sahhaEndDate: Date
    var body: String = "startDate: $startDate | endDate: $endDate"

    try {
      sahhaStartDate = Date(startDate.toLong())
      sahhaEndDate = Date(endDate.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.getBiomarkers() parameters invalid"
      Sahha.postError(
        SahhaFramework.react_native,
        message,
        "SahhaReactNativeModule",
        "getBiomarkers",
        body
      )
      callback.invoke(message, null)
      return
    }

    Log.d("Sahha", "getBiomarkers startDate $sahhaStartDate")
    Log.d("Sahha", "getBiomarkers endDate $sahhaEndDate")
    Sahha.getBiomarkers(
      sahhaBiomarkerCategories,
      sahhaBiomarkerTypes,
      Pair(sahhaStartDate, sahhaEndDate)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getBiomarkers() failed"
        body =
          "startDate: $startDate | endDate: $endDate | startDate: $sahhaStartDate | endDate: $sahhaEndDate"
        Sahha.postError(
          SahhaFramework.react_native,
          message,
          "SahhaReactNativeModule",
          "getBiomarkers",
          body
        )
        callback.invoke(message, null)
      } else {
        callback.invoke(error, value)
      }
    }
  }

  @ReactMethod
  fun getStats(
    sensor: String,
    startDate: Double,
    endDate: Double,
    callback: Callback,
  ) {
    val sahhaStartDate: Date
    val sahhaEndDate: Date
    var body: String = "startDate: $startDate | endDate: $endDate"

    try {
      sahhaStartDate = Date(startDate.toLong())
      sahhaEndDate = Date(endDate.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.getStats() parameters invalid"
      Sahha.postError(
        SahhaFramework.react_native,
        message,
        "SahhaReactNativeModule",
        "getStats",
        body
      )
      callback.invoke(message, null)
      return
    }

    Log.d("Sahha", "getStats startDate $sahhaStartDate")
    Log.d("Sahha", "getStats endDate $sahhaEndDate")
    Sahha.getStats(
      SahhaSensor.valueOf(sensor),
      Pair(sahhaStartDate, sahhaEndDate)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getStats() failed"
        body =
          "startDate: $startDate | endDate: $endDate | startDate: $sahhaStartDate | endDate: $sahhaEndDate"
        Sahha.postError(
          SahhaFramework.react_native,
          message,
          "SahhaReactNativeModule",
          "getStats",
          body
        )
        callback.invoke(message, null)
      } else if (value != null) {
        val gson = GsonBuilder()
          .registerTypeAdapter(
            ZonedDateTime::class.java,
            JsonSerializer<ZonedDateTime> { src, _, _ ->
              JsonPrimitive(src.toString())
            }
          ).create()
        val string: String = gson.toJson(value)
        Log.d("Sahha", string)
        callback.invoke(null, string)
      } else {
        callback.invoke("No stats available for $sensor", null)
      }
    }
  }

  @ReactMethod
  fun openAppSettings() {
    Sahha.openAppSettings(reactApplicationContext.baseContext)
  }
}
