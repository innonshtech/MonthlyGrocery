package com.monthlygrocerymobile

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NativeLocationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "NativeLocationModule"
    }

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        val context = reactApplicationContext

        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

        if (!hasFine && !hasCoarse) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted")
            return
        }

        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        if (locationManager == null) {
            promise.reject("UNAVAILABLE", "Location service not available on device")
            return
        }

        // 1. First check last known locations from GPS and Network providers
        var bestLocation: Location? = null
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)

        for (provider in providers) {
            try {
                if (locationManager.isProviderEnabled(provider)) {
                    val loc = locationManager.getLastKnownLocation(provider)
                    if (loc != null) {
                        if (bestLocation == null || loc.time > bestLocation.time) {
                            bestLocation = loc
                        }
                    }
                }
            } catch (_: SecurityException) {}
        }

        // If last known location is fresh enough (within last 15 minutes), return immediately
        val now = System.currentTimeMillis()
        if (bestLocation != null && (now - bestLocation.time) < 15 * 60 * 1000) {
            val map = Arguments.createMap().apply {
                putDouble("latitude", bestLocation.latitude)
                putDouble("longitude", bestLocation.longitude)
                putDouble("accuracy", bestLocation.accuracy.toDouble())
                putDouble("timestamp", bestLocation.time.toDouble())
            }
            promise.resolve(map)
            return
        }

        // 2. Request a single live update if last location is old or null
        val mainHandler = Handler(Looper.getMainLooper())
        var isResolved = false

        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (!isResolved) {
                    isResolved = true
                    try {
                        locationManager.removeUpdates(this)
                    } catch (_: Exception) {}

                    val map = Arguments.createMap().apply {
                        putDouble("latitude", location.latitude)
                        putDouble("longitude", location.longitude)
                        putDouble("accuracy", location.accuracy.toDouble())
                        putDouble("timestamp", location.time.toDouble())
                    }
                    promise.resolve(map)
                }
            }

            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }

        mainHandler.post {
            try {
                var requested = false
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestSingleUpdate(LocationManager.GPS_PROVIDER, locationListener, Looper.getMainLooper())
                    requested = true
                }
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, locationListener, Looper.getMainLooper())
                    requested = true
                }

                if (!requested && bestLocation != null) {
                    isResolved = true
                    val map = Arguments.createMap().apply {
                        putDouble("latitude", bestLocation.latitude)
                        putDouble("longitude", bestLocation.longitude)
                        putDouble("accuracy", bestLocation.accuracy.toDouble())
                        putDouble("timestamp", bestLocation.time.toDouble())
                    }
                    promise.resolve(map)
                    return@post
                }

                // 8 second timeout fallback
                mainHandler.postDelayed({
                    if (!isResolved) {
                        isResolved = true
                        try {
                            locationManager.removeUpdates(locationListener)
                        } catch (_: Exception) {}

                        if (bestLocation != null) {
                            val map = Arguments.createMap().apply {
                                putDouble("latitude", bestLocation.latitude)
                                putDouble("longitude", bestLocation.longitude)
                                putDouble("accuracy", bestLocation.accuracy.toDouble())
                                putDouble("timestamp", bestLocation.time.toDouble())
                            }
                            promise.resolve(map)
                        } else {
                            promise.reject("TIMEOUT", "Location request timed out")
                        }
                    }
                }, 8000)

            } catch (e: Exception) {
                if (!isResolved) {
                    isResolved = true
                    if (bestLocation != null) {
                        val map = Arguments.createMap().apply {
                            putDouble("latitude", bestLocation.latitude)
                            putDouble("longitude", bestLocation.longitude)
                            putDouble("accuracy", bestLocation.accuracy.toDouble())
                            putDouble("timestamp", bestLocation.time.toDouble())
                        }
                        promise.resolve(map)
                    } else {
                        promise.reject("ERROR", e.message ?: "Failed to get location")
                    }
                }
            }
        }
    }
}
