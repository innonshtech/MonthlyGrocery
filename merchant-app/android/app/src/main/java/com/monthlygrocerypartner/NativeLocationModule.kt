package com.monthlygrocerypartner

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

    override fun getName(): String = "NativeLocation"

    @ReactMethod
    fun getCurrentLocation(promise: Promise) {
        val context = reactApplicationContext
        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

        if (!hasFine && !hasCoarse) {
            promise.reject("PERMISSION_DENIED", "Location permission is not granted.")
            return
        }

        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        if (locationManager == null) {
            promise.reject("NO_LOCATION_MANAGER", "Location service is unavailable on device.")
            return
        }

        val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

        if (!isGpsEnabled && !isNetworkEnabled) {
            promise.reject("LOCATION_DISABLED", "Device GPS/Location services are disabled. Please turn on Location in Settings.")
            return
        }

        // Try getting best last known location first
        var bestLocation: Location? = null
        if (isGpsEnabled) {
            try {
                val loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                if (loc != null) bestLocation = loc
            } catch (e: SecurityException) {
                // Ignore
            }
        }
        if (isNetworkEnabled) {
            try {
                val loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                if (loc != null) {
                    if (bestLocation == null || loc.time > bestLocation.time) {
                        bestLocation = loc
                    }
                }
            } catch (e: SecurityException) {
                // Ignore
            }
        }

        // If last known location is fresh (less than 2 minutes old), return immediately
        val twoMinutesAgo = System.currentTimeMillis() - 120000
        if (bestLocation != null && bestLocation.time > twoMinutesAgo) {
            val map = Arguments.createMap().apply {
                putDouble("latitude", bestLocation.latitude)
                putDouble("longitude", bestLocation.longitude)
                putDouble("accuracy", bestLocation.accuracy.toDouble())
            }
            promise.resolve(map)
            return
        }

        // Otherwise request a fresh single location update on main thread
        Handler(Looper.getMainLooper()).post {
            var resolved = false
            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    if (!resolved) {
                        resolved = true
                        try {
                            locationManager.removeUpdates(this)
                        } catch (e: SecurityException) {}
                        val map = Arguments.createMap().apply {
                            putDouble("latitude", location.latitude)
                            putDouble("longitude", location.longitude)
                            putDouble("accuracy", location.accuracy.toDouble())
                        }
                        promise.resolve(map)
                    }
                }

                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
                override fun onProviderEnabled(provider: String) {}
                override fun onProviderDisabled(provider: String) {}
            }

            try {
                if (isGpsEnabled) {
                    locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0L, 0f, listener, Looper.getMainLooper())
                }
                if (isNetworkEnabled) {
                    locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0L, 0f, listener, Looper.getMainLooper())
                }

                // 10 second timeout handler
                Handler(Looper.getMainLooper()).postDelayed({
                    if (!resolved) {
                        resolved = true
                        try {
                            locationManager.removeUpdates(listener)
                        } catch (e: SecurityException) {}

                        if (bestLocation != null) {
                            val map = Arguments.createMap().apply {
                                putDouble("latitude", bestLocation.latitude)
                                putDouble("longitude", bestLocation.longitude)
                                putDouble("accuracy", bestLocation.accuracy.toDouble())
                            }
                            promise.resolve(map)
                        } else {
                            promise.reject("TIMEOUT", "Location request timed out. Please try moving closer to a window or outdoors.")
                        }
                    }
                }, 10000)
            } catch (e: SecurityException) {
                if (!resolved) {
                    resolved = true
                    promise.reject("SECURITY_ERROR", e.message)
                }
            }
        }
    }
}
