package com.monthlygrocerymobile

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import java.io.File

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    val otaBundle = File(applicationContext.filesDir, "ota_bundle/index.android.bundle")
    val jsBundleFilePath = if (otaBundle.exists() && otaBundle.length() > 1024) otaBundle.absolutePath else null

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
    loadReactNative(this)
  }
}
