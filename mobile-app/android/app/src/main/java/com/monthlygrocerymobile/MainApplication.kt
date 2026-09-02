package com.monthlygrocerymobile

import android.app.Application
import android.graphics.Typeface
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.views.text.ReactFontManager

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    try {
      val fontManager = ReactFontManager.getInstance()
      val assets = assets

      val balooBold = Typeface.createFromAsset(assets, "fonts/Baloo2-Bold.ttf")
      val balooSemiBold = Typeface.createFromAsset(assets, "fonts/Baloo2-SemiBold.ttf")
      val balooMedium = Typeface.createFromAsset(assets, "fonts/Baloo2-Medium.ttf")
      val balooRegular = Typeface.createFromAsset(assets, "fonts/Baloo2-Regular.ttf")
      val balooExtraBold = Typeface.createFromAsset(assets, "fonts/Baloo2-ExtraBold.ttf")

      val muktaBold = Typeface.createFromAsset(assets, "fonts/Mukta-Bold.ttf")
      val muktaSemiBold = Typeface.createFromAsset(assets, "fonts/Mukta-SemiBold.ttf")
      val muktaMedium = Typeface.createFromAsset(assets, "fonts/Mukta-Medium.ttf")
      val muktaRegular = Typeface.createFromAsset(assets, "fonts/Mukta-Regular.ttf")

      // Register font family "Baloo 2"
      fontManager.addCustomFont("Baloo 2", Typeface.BOLD, balooBold)
      fontManager.addCustomFont("Baloo 2", Typeface.NORMAL, balooRegular)

      // Register font family "Baloo2"
      fontManager.addCustomFont("Baloo2", Typeface.BOLD, balooBold)
      fontManager.addCustomFont("Baloo2", Typeface.NORMAL, balooRegular)

      // Register variant font family names
      fontManager.addCustomFont("Baloo2-Bold", Typeface.BOLD, balooBold)
      fontManager.addCustomFont("Baloo2-Bold", Typeface.NORMAL, balooBold)
      fontManager.addCustomFont("Baloo2-SemiBold", Typeface.BOLD, balooSemiBold)
      fontManager.addCustomFont("Baloo2-SemiBold", Typeface.NORMAL, balooSemiBold)
      fontManager.addCustomFont("Baloo2-Medium", Typeface.NORMAL, balooMedium)
      fontManager.addCustomFont("Baloo2-Regular", Typeface.NORMAL, balooRegular)
      fontManager.addCustomFont("Baloo2-ExtraBold", Typeface.BOLD, balooExtraBold)

      // Register font family "Mukta"
      fontManager.addCustomFont("Mukta", Typeface.BOLD, muktaBold)
      fontManager.addCustomFont("Mukta", Typeface.NORMAL, muktaRegular)

      // Register variant Mukta names
      fontManager.addCustomFont("Mukta-Bold", Typeface.BOLD, muktaBold)
      fontManager.addCustomFont("Mukta-Bold", Typeface.NORMAL, muktaBold)
      fontManager.addCustomFont("Mukta-SemiBold", Typeface.BOLD, muktaSemiBold)
      fontManager.addCustomFont("Mukta-SemiBold", Typeface.NORMAL, muktaSemiBold)
      fontManager.addCustomFont("Mukta-Medium", Typeface.NORMAL, muktaMedium)
      fontManager.addCustomFont("Mukta-Regular", Typeface.NORMAL, muktaRegular)
    } catch (e: Exception) {
      android.util.Log.e("MainApplication", "Error registering custom fonts", e)
    }
    loadReactNative(this)
  }
}
