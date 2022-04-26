package com.sahhareactnative

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.ActivityCompat.shouldShowRequestPermissionRationale
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import com.google.gson.Gson
import sdk.sahha.android.source.*


class SahhaReactNativeModule(reactContext: ReactApplicationContext) : PermissionListener, ReactContextBaseJavaModule(reactContext) {

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

    if (sensors != null) {
      var sahhaSensors: MutableSet<SahhaSensor> = mutableSetOf()
      try {
        sensors.toArrayList().forEach {
          var sensor = SahhaSensor.valueOf(it as String)
          sahhaSensors.add(sensor)
        }
        sahhaSettings = SahhaSettings(sahhaEnvironment, SahhaFramework.react_native, sahhaSensors, postSensorDataManually)
      } catch (e: IllegalArgumentException) {
        callback.invoke("Sahha.configure() sensor parameter is not valid", null)
        return
      }
    } else {
      sahhaSettings = SahhaSettings(sahhaEnvironment, SahhaFramework.react_native, postSensorDataManually = postSensorDataManually)
    }
    Log.d("Sahha", "Activity")
    Log.d("Sahha", currentActivity.toString())
    var app = currentActivity?.application

    if (app != null) {
      Sahha.configure(app, sahhaSettings)
      callback(null, true)
    } else {
      callback("Sahha.configure() application parameter is null", false)
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

  private fun getPermissionAwareActivity(): PermissionAwareActivity? {
    try {
      if (currentActivity != null) {
        var permissionAwareActivity = currentActivity as PermissionAwareActivity
        return permissionAwareActivity
      } else {
        return null
      }
    } catch (error: Error) {
      return null
    }
  }

  @ReactMethod
  fun activityStatus(activity: String, callback: Callback) {
    var sahhaActivity = SahhaActivity.valueOf(activity)
    when (sahhaActivity) {
      SahhaActivity.motion -> {
        val isEnabled = ContextCompat.checkSelfPermission(reactApplicationContext.baseContext, Manifest.permission.ACTIVITY_RECOGNITION)
        if (isEnabled == PackageManager.PERMISSION_GRANTED)
          callback.invoke(null, SahhaActivityStatus.enabled.ordinal)
        else {
          var permissionAwareActivity = getPermissionAwareActivity()
          if (permissionAwareActivity != null) {
            if (permissionAwareActivity.shouldShowRequestPermissionRationale(Manifest.permission.ACTIVITY_RECOGNITION)) {
              permissionCallback?.invoke(null, SahhaActivityStatus.pending.ordinal)
            } else {
              permissionCallback?.invoke(null, SahhaActivityStatus.disabled.ordinal)
            }
          }
        }
      }
      else -> {
        permissionCallback?.invoke("Requested Sahha activity is not a valid activity", null)
      }
    }

    return
    // TODO: Use Sahha Android SDK
    /*
    try {
      var sahhaActivity = SahhaActivity.valueOf(activity)
      when (sahhaActivity) {
        SahhaActivity.motion -> {
          callback.invoke(null, Sahha.motion.activityStatus.ordinal)
        }
        else -> {
          callback.invoke("Sahha activity parameter is not valid", null)
        }
      }
    } catch (e: IllegalArgumentException) {
      callback.invoke("Sahha activity parameter is not valid", null)
    }
     */
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>?, grantResults: IntArray?): Boolean {
    when (requestCode) {
      0 -> {
        // If request is cancelled, the result arrays are empty.
        if (grantResults != null && grantResults.isNotEmpty()) {
          when (grantResults[0]) {
            PackageManager.PERMISSION_DENIED -> {
              var permissionAwareActivity = getPermissionAwareActivity()
              if (permissionAwareActivity != null) {
                if (permissionAwareActivity.shouldShowRequestPermissionRationale(Manifest.permission.ACTIVITY_RECOGNITION)) {
                  permissionCallback?.invoke(null, SahhaActivityStatus.pending.ordinal)
                } else {
                  permissionCallback?.invoke(null, SahhaActivityStatus.disabled.ordinal)
                }
              } else {
                permissionCallback?.invoke(null, SahhaActivityStatus.pending.ordinal)
              }
            }
            PackageManager.PERMISSION_GRANTED -> {
              permissionCallback?.invoke(null, SahhaActivityStatus.enabled.ordinal)
            }
            else -> {
              permissionCallback?.invoke("Requested Sahha activity status could not be determined", null)
            }
          }
        } else {
          permissionCallback?.invoke("Requested Sahha activity status could not be determined", null)
        }
      }
      // Add other 'when' lines to check for other
      // permissions this app might request.
      else -> {
        // Ignore all other requests.
        permissionCallback?.invoke("Requested Sahha activity is not a valid activity", null)
      }
    }
    permissionCallback = null
    return true
  }

  private var permissionCallback: Callback? = null

  @ReactMethod
  fun activate(activity: String, callback: Callback) {
    var sahhaActivity = SahhaActivity.valueOf(activity)
    when (sahhaActivity) {
      SahhaActivity.motion -> {
        var permissionAwareActivity = getPermissionAwareActivity()
        if (permissionAwareActivity != null) {
          permissionCallback = callback
          permissionAwareActivity.requestPermissions(arrayOf(Manifest.permission.ACTIVITY_RECOGNITION), 0, this)
        } else {
          callback.invoke("Sahha activity not able to be activated", null)
        }
      }
      else -> {
        permissionCallback?.invoke("Requested Sahha activity is not a valid activity", null)
      }
    }

    return
    // TODO: Use Sahha Android SDK
    /*
    try {
      var sahhaActivity = SahhaActivity.valueOf(activity)
      when (sahhaActivity) {
        SahhaActivity.motion -> {
          Sahha.motion.activate { error, newStatus ->
            callback.invoke(error, newStatus.ordinal)
          }
        }
        else -> {
          callback.invoke("Sahha activity parameter is not valid", null)
        }
      }
    } catch (e: IllegalArgumentException) {
      callback.invoke("Sahha activity parameter is not valid", null)
    }
    */
  }

  @ReactMethod
  fun postSensorData(settings: ReadableMap, callback: Callback) {

    var sensors: ReadableArray? = settings.getArray("sensors")
    if (sensors == null) {
      callback.invoke("Sahha.postSensorData() sensors parameter is missing", null)
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
  fun analyze(callback: Callback) {

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
