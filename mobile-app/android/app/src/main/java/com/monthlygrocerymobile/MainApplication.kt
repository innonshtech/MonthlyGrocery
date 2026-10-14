package com.monthlygrocerymobile

import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import java.io.File

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    val prefs = getSharedPreferences("ota_prefs", Context.MODE_PRIVATE)
    val bootCrashCount = prefs.getInt("boot_crash_count", 0)

    val otaDir = File(applicationContext.filesDir, "ota_bundle")
    val otaBundle = File(otaDir, "index.android.bundle")

    val jsBundleFilePath = if (bootCrashCount >= 2) {
      // Auto-Rollback: Previous OTA bundle failed to boot twice in a row.
      // Delete corrupted bundle and fall back to embedded APK bundle.
      otaDir.deleteRecursively()
      prefs.edit().putInt("boot_crash_count", 0).apply()
      null
    } else if (otaBundle.exists() && otaBundle.length() > 1024) {
      otaBundle.absolutePath
    } else {
      null
    }

    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here:
          add(NativeLocationPackage())
          add(OtaUpdatePackage())
        },
      jsBundleFilePath = jsBundleFilePath
    )
  }

  override fun onCreate() {
    super.onCreate()

    // Track boot safety: increment crash counter during launch.
    // If the app stays alive for 6 seconds without crashing, reset the counter to 0.
    val prefs = getSharedPreferences("ota_prefs", Context.MODE_PRIVATE)
    val currentCrashes = prefs.getInt("boot_crash_count", 0)
    prefs.edit().putInt("boot_crash_count", currentCrashes + 1).apply()

    Handler(Looper.getMainLooper()).postDelayed({
      prefs.edit().putInt("boot_crash_count", 0).apply()
    }, 6000)

    loadReactNative(this)
  }
}

