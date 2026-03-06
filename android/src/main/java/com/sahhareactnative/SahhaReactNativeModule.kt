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
import ai.sahha.api.Sahha
import ai.sahha.api.biomarkers.SahhaBiomarkerCategory
import ai.sahha.api.biomarkers.SahhaBiomarkerType
import ai.sahha.api.demographic.SahhaDemographic
import ai.sahha.api.settings.SahhaEnvironment
import ai.sahha.api.notifications.SahhaNotificationConfiguration
import ai.sahha.api.settings.SahhaFramework
import ai.sahha.api.score.SahhaScoreType
import ai.sahha.api.sensors.SahhaSensor
import ai.sahha.api.sensors.SahhaSensorStatus
import ai.sahha.api.settings.SahhaSettings
import android.content.Context
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
      sahhaEnvironment = SahhaEnvironment.valueOf(environment.uppercase())
    } catch (e: IllegalArgumentException) {
      // Sahha.postError()
      callback.invoke("Sahha.configure() environment parameter is invalid", null)
      return
    }
    // Notification config
    var sahhaNotificationConfiguration = SahhaNotificationConfiguration.DEFAULT
    try {
      settings.getMap("notificationSettings")?.also { nSettings ->
        val icon = nSettings.getString("icon")
        val title = nSettings.getString("title")
        val shortDescription = nSettings.getString("shortDescription")
        sahhaNotificationConfiguration = SahhaNotificationConfiguration(
          stringToDrawableResource(
            reactContext,
            icon
          ) ?: 0,
          title ?: "title",
          shortDescription ?: "shortDescription",
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
      framework = SahhaFramework.REACT_NATIVE
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
    val age: Int? =
      if (demographic.hasKey("age") && !demographic.isNull("age")) demographic.getInt("age") else null

    val gender: String? = demographic.getString("gender")
    val birthDate: String? = demographic.getString("birthDate")

    val sahhaDemographic = SahhaDemographic(
      age = age,
      gender = gender,
      birthDate = birthDate
    )

    Sahha.postDemographic(sahhaDemographic) { error, success ->
      callback.invoke(error, success)
    }
  }


  override fun getSensorStatus(sensors: ReadableArray, callback: Callback) {
    val sahhaSensors = sensors.toArrayList().map { SahhaSensor.valueOf((it as String).uppercase()) }.toSet()
    Sahha.getSensorStatus(
        // This should work; change to reactContext.applicationContext if issues
      sahhaSensors
    ) { error, sensorStatus ->
      callback.invoke(error, sensorStatus.ordinal)
    }
  }

  override fun enableSensors(sensors: ReadableArray, callback: Callback) {
    val sahhaSensors = sensors.toArrayList()
      .map { SahhaSensor.valueOf((it as String).uppercase()) }
      .toSet()

    Sahha.enableSensors(sahhaSensors) { error, _ ->
      if (error != null) {
        callback.invoke(error, null)
        return@enableSensors
      }

      // After enabling, fetch the real status (0..3)
      Sahha.getSensorStatus(sahhaSensors) { statusError, sensorStatus ->
        if (statusError != null) {
          callback.invoke(statusError, null)
        } else {
          callback.invoke(null, sensorStatus.ordinal)
        }
      }
    }
  }

  override fun getScores(
    types: ReadableArray,
    startDateTime: Double,
    endDateTime: Double,
    callback: Callback,
  ) {
    val sahhaScoreTypes = types.toArrayList().map { SahhaScoreType.valueOf((it as String).uppercase()) }.toSet()
    val sahhaStartDateTime: Date
    val sahhaEndDateTime: Date
    var body: String = "startDateTime: $startDateTime | endDateTime: $endDateTime"
    try {
      sahhaStartDateTime = Date(startDateTime.toLong())
      sahhaEndDateTime = Date(endDateTime.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.getScores() parameters invalid"
      Sahha.postError(
        SahhaFramework.REACT_NATIVE,
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
          SahhaFramework.REACT_NATIVE,
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
      categories.toArrayList().map { SahhaBiomarkerCategory.valueOf((it as String).uppercase()) }.toSet()
    val sahhaBiomarkerTypes =
      types.toArrayList().map { SahhaBiomarkerType.valueOf((it as String).uppercase()) }.toSet()
    val sahhaStartDateTime: Date
    val sahhaEndDateTime: Date
    var body: String = "startDateTime: $startDateTime | endDateTime: $endDateTime"
    try {
      sahhaStartDateTime = Date(startDateTime.toLong())
      sahhaEndDateTime = Date(endDateTime.toLong())
    } catch (e: IllegalArgumentException) {
      val message: String = "Sahha.getBiomarkers() parameters invalid"
      Sahha.postError(
        SahhaFramework.REACT_NATIVE,
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
          SahhaFramework.REACT_NATIVE,
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
        SahhaFramework.REACT_NATIVE,
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
      SahhaSensor.valueOf(sensor.uppercase()),
      Pair(sahhaStartDateTime, sahhaEndDateTime)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getStats() failed"
        body =
          "startDateTime: $startDateTime | endDateTime: $endDateTime | startDateTime: $sahhaStartDateTime | endDateTime: $sahhaEndDateTime"
        Sahha.postError(
          SahhaFramework.REACT_NATIVE,
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
        SahhaFramework.REACT_NATIVE,
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
      SahhaSensor.valueOf(sensor.uppercase()),
      Pair(sahhaStartDateTime, sahhaEndDateTime)
    ) { error, value ->
      if (error == null && value == null) {
        val message: String = "Sahha.getSamples() failed"
        body =
          "startDateTime: $startDateTime | endDateTime: $endDateTime | startDateTime: $sahhaStartDateTime | endDateTime: $sahhaEndDateTime"
        Sahha.postError(
          SahhaFramework.REACT_NATIVE,
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
    Sahha.openAppSettings()
  }
  fun stringToDrawableResource(context: Context, iconString: String?): Int? {
    return try {
      context.resources.getIdentifier(iconString, "drawable", context.packageName)
    } catch (e: Exception) {
      null
    }
  }
}