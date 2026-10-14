package com.monthlygrocerymobile

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import org.json.JSONObject

class OtaUpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "OtaUpdateModule"

    private val otaDir: File
        get() {
            val dir = File(reactApplicationContext.filesDir, "ota_bundle")
            if (!dir.exists()) dir.mkdirs()
            return dir
        }

    private val metaFile: File
        get() = File(otaDir, "ota_meta.json")

    private val activeBundleFile: File
        get() = File(otaDir, "index.android.bundle")

    @ReactMethod
    fun getCurrentBundleInfo(promise: Promise) {
        try {
            val map = Arguments.createMap()
            var version = "base-apk"
            if (metaFile.exists()) {
                val jsonStr = metaFile.readText()
                val json = JSONObject(jsonStr)
                version = json.optString("version", "base-apk")
            }
            map.putString("version", version)
            map.putBoolean("isOtaActive", activeBundleFile.exists() && activeBundleFile.length() > 0)
            map.putDouble("bundleSizeBytes", if (activeBundleFile.exists()) activeBundleFile.length().toDouble() else 0.0)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("INFO_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun downloadAndInstallBundle(bundleUrlString: String, version: String, promise: Promise) {
        Thread {
            try {
                val stagingFile = File(otaDir, "staging.bundle")
                if (stagingFile.exists()) stagingFile.delete()

                val url = URL(bundleUrlString)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 15000
                conn.readTimeout = 60000
                conn.instanceFollowRedirects = true
                conn.connect()

                if (conn.responseCode !in 200..299) {
                    promise.reject("HTTP_ERROR", "Server returned HTTP ${conn.responseCode}")
                    return@Thread
                }

                conn.inputStream.use { input ->
                    FileOutputStream(stagingFile).use { output ->
                        val buffer = ByteArray(8192)
                        var bytesRead: Int
                        while (input.read(buffer).also { bytesRead = it } != -1) {
                            output.write(buffer, 0, bytesRead)
                        }
                    }
                }

                if (!stagingFile.exists() || stagingFile.length() < 1024) {
                    stagingFile.delete()
                    promise.reject("INVALID_BUNDLE", "Downloaded bundle is invalid or too small")
                    return@Thread
                }

                if (activeBundleFile.exists()) activeBundleFile.delete()
                val renamed = stagingFile.renameTo(activeBundleFile)
                if (!renamed) {
                    stagingFile.copyTo(activeBundleFile, overwrite = true)
                    stagingFile.delete()
                }

                val metaJson = JSONObject().apply {
                    put("version", version)
                    put("installedAt", System.currentTimeMillis())
                }
                metaFile.writeText(metaJson.toString())

                val result = Arguments.createMap()
                result.putBoolean("success", true)
                result.putString("version", version)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("DOWNLOAD_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun rollbackBundle(promise: Promise) {
        try {
            if (activeBundleFile.exists()) activeBundleFile.delete()
            if (metaFile.exists()) metaFile.delete()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ROLLBACK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun restartApp() {
        try {
            val context = reactApplicationContext
            val packageManager = context.packageManager
            val intent = packageManager.getLaunchIntentForPackage(context.packageName)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
                context.startActivity(intent)
                Runtime.getRuntime().exit(0)
            } else {
                reactApplicationContext.currentActivity?.recreate()
            }
        } catch (e: Exception) {
            reactApplicationContext.currentActivity?.recreate()
        }
    }
}
