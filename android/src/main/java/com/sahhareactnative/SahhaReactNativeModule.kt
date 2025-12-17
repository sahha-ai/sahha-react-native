package com.sahhareactnative

import android.util.Log
import androidx.activity.ComponentActivity
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
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

private const val TAG = "SahhaReactNativeModule"

class SahhaReactNativeModule(private val reactContext: ReactApplicationContext) :
  NativeSahhaReactNativeSpec(reactContext) {

  companion object {
    const val NAME = "SahhaReactNative"
  }

  override fun getName(): String {
    return NAME
  }

  override fun invalidate() {}

  override fun configure(settings: ReadableMap, callback: Callback) {
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
            reactContext,
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
    val activity = reactContext.currentActivity as? ComponentActivity  // CHANGED: Use reactContext.currentActivity
    if (activity == null) {
      callback("Sahha.configure() activity parameter is null", false)
    } else {
      Sahha.configure(activity, sahhaSettings) { error, success ->
        callback(error, success)
      }
    }
  }

  override fun isAuthenticated(callback: Callback) {
    callback(null, Sahha.isAuthenticated)
  }

  override fun authenticate(appId: String, appSecret: String, externalId: String, callback: Callback) {
    Sahha.authenticate(appId, appSecret, externalId) { error, success ->
      callback(error, success)
    }
  }

  override fun authenticateToken(profileToken: String, refreshToken: String, callback: Callback) {
    Sahha.authenticate(profileToken, refreshToken) { error, success ->
      callback(error, success)
    }
  }

  override fun deauthenticate(callback: Callback) {
    Sahha.deauthenticate { error, success ->
      callback(error, success)
    }
  }

  override fun getProfileToken(callback: Callback) {
    callback.invoke(null, Sahha.profileToken)
  }

  override fun getDemographic(callback: Callback) {
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

  override fun postDemographic(demographic: ReadableMap, callback: Callback) {
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
      gender,
      birthDate
    )
    Sahha.postDemographic(sahhaDemographic) { error, success ->
      callback.invoke(error, success)
    }
  }

  override fun getSensorStatus(sensors: ReadableArray, callback: Callback) {
    val sahhaSensors = sensors.toArrayList().map { SahhaSensor.valueOf(it as String) }.toSet()
    Sahha.getSensorStatus(
      reactContext.baseContext,  // This should work; change to reactContext.applicationContext if issues
      sahhaSensors
    ) { error, sensorStatus ->
      callback.invoke(error, sensorStatus.ordinal)
    }
  }

  override fun enableSensors(sensors: ReadableArray, callback: Callback) {
    val sahhaSensors = sensors.toArrayList().map { SahhaSensor.valueOf(it as String) }.toSet()
    Sahha.enableSensors(reactContext.baseContext, sahhaSensors) { error, sensorStatus ->
      callback.invoke(error, sensorStatus.ordinal)
    }
  }

  override fun getScores(
    types: ReadableArray,
    startDateTime: Double,
    endDateTime: Double,
    callback: Callback,
  ) {
    val sahhaScoreTypes = types.toArrayList().map { SahhaScoreType.valueOf(it as String) }.toSet()
    val sahhaStartDateTime: Date
    val sahhaEndDateTime: Date
    var body: String = "startDateTime: $startDateTime | endDateTime: $endDateTime"
    try {
      sahhaStartDateTime = Date(startDateTime.toLong())
      sahhaEndDateTime = Date(endDateTime.toLong())
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
    Log.d("Sahha", "getScores startDateTime $sahhaStartDateTime")
    Log.d("Sahha", "getScores endDateTime $sahhaEndDateTime")
    Sahha.getScores(sahhaScoreTypes, Pair(sahhaStartDateTime, sahhaEndDateTime)) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getScores() failed"
        body =
          "startDateTime: $startDateTime | endDateTime: $endDateTime | startDateTime: $sahhaStartDateTime | endDateTime: $sahhaEndDateTime"
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

  override fun getBiomarkers(
    categories: ReadableArray,
    types: ReadableArray,
    startDateTime: Double,
    endDateTime: Double,
    callback: Callback,
  ) {
    val sahhaBiomarkerCategories =
      categories.toArrayList().map { SahhaBiomarkerCategory.valueOf(it as String) }.toSet()
    val sahhaBiomarkerTypes =
      types.toArrayList().map { SahhaBiomarkerType.valueOf(it as String) }.toSet()
    val sahhaStartDateTime: Date
    val sahhaEndDateTime: Date
    var body: String = "startDateTime: $startDateTime | endDateTime: $endDateTime"
    try {
      sahhaStartDateTime = Date(startDateTime.toLong())
      sahhaEndDateTime = Date(endDateTime.toLong())
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
    Log.d("Sahha", "getBiomarkers startDateTime $sahhaStartDateTime")
    Log.d("Sahha", "getBiomarkers endDateTime $sahhaEndDateTime")
    Sahha.getBiomarkers(
      sahhaBiomarkerCategories,
      sahhaBiomarkerTypes,
      Pair(sahhaStartDateTime, sahhaEndDateTime)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getBiomarkers() failed"
        body =
          "startDateTime: $startDateTime | endDateTime: $endDateTime | startDateTime: $sahhaStartDateTime | endDateTime: $sahhaEndDateTime"
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

  override fun getStats(
    sensor: String,
    startDateTime: Double,
    endDateTime: Double,
    callback: Callback,
  ) {
    val sahhaStartDateTime: Date
    val sahhaEndDateTime: Date
    var body: String = "startDateTime: $startDateTime | endDateTime: $endDateTime"
    try {
      sahhaStartDateTime = Date(startDateTime.toLong())
      sahhaEndDateTime = Date(endDateTime.toLong())
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
    Log.d("Sahha", "getStats startDateTime $sahhaStartDateTime")
    Log.d("Sahha", "getStats endDateTime $sahhaEndDateTime")
    Sahha.getStats(
      SahhaSensor.valueOf(sensor),
      Pair(sahhaStartDateTime, sahhaEndDateTime)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getStats() failed"
        body =
          "startDateTime: $startDateTime | endDateTime: $endDateTime | startDateTime: $sahhaStartDateTime | endDateTime: $sahhaEndDateTime"
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

  override fun getSamples(
    sensor: String,
    startDateTime: Double,
    endDateTime: Double,
    callback: Callback,
  ) {
    val sahhaStartDateTime: Date
    val sahhaEndDateTime: Date
    var body: String = "startDateTime: $startDateTime | endDateTime: $endDateTime"
    try {
      sahhaStartDateTime = Date(startDateTime.toLong())
      sahhaEndDateTime = Date(endDateTime.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.getSamples() parameters invalid"
      Sahha.postError(
        SahhaFramework.react_native,
        message,
        "SahhaReactNativeModule",
        "getSamples",
        body
      )
      callback.invoke(message, null)
      return
    }
    Log.d("Sahha", "getSamples startDateTime $sahhaStartDateTime")
    Log.d("Sahha", "getSamples endDateTime $sahhaEndDateTime")
    Sahha.getSamples(
      SahhaSensor.valueOf(sensor),
      Pair(sahhaStartDateTime, sahhaEndDateTime)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getSamples() failed"
        body =
          "startDateTime: $startDateTime | endDateTime: $endDateTime | startDateTime: $sahhaStartDateTime | endDateTime: $sahhaEndDateTime"
        Sahha.postError(
          SahhaFramework.react_native,
          message,
          "SahhaReactNativeModule",
          "getSamples",
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
        callback.invoke("No samples available for $sensor", null)
      }
    }
  }

  @Deprecated(message = "postSensorData is only supported on iOS", level = DeprecationLevel.WARNING)
  override fun postSensorData() {
    Log.w(TAG, "postSensorData is only supported on iOS")
  }

  override fun openAppSettings() {
    Sahha.openAppSettings(reactContext.baseContext)
  }
}