package com.monthlygrocerypartner

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.Ringtone
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OrderAlertSoundModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var currentRingtone: Ringtone? = null
    private var mediaPlayer: MediaPlayer? = null
    private var isPlaying = false
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun getName(): String = "OrderAlertSound"

    @ReactMethod
    fun playNewOrderAlert(promise: Promise?) {
        mainHandler.post {
            try {
                stopAlertInternal()
                val context = reactApplicationContext

                var alertUri: Uri? = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                if (alertUri == null) {
                    alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                }
                if (alertUri == null) {
                    alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                }

                if (alertUri != null) {
                    currentRingtone = RingtoneManager.getRingtone(context, alertUri)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        val attributes = AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                        currentRingtone?.audioAttributes = attributes
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        currentRingtone?.isLooping = true
                    }
                    currentRingtone?.play()
                    isPlaying = true
                } else {
                    playToneSequence()
                }

                triggerVibrationInternal()
                promise?.resolve(true)
            } catch (e: Exception) {
                try {
                    playToneSequence()
                    triggerVibrationInternal()
                    promise?.resolve(true)
                } catch (ex: Exception) {
                    promise?.reject("SOUND_ERROR", ex.message)
                }
            }
        }
    }

    @ReactMethod
    fun stopNewOrderAlert(promise: Promise?) {
        mainHandler.post {
            try {
                stopAlertInternal()
                promise?.resolve(true)
            } catch (e: Exception) {
                promise?.reject("STOP_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun playSuccessChime(promise: Promise?) {
        mainHandler.post {
            try {
                val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100)
                toneGen.startTone(ToneGenerator.TONE_PROP_BEEP2, 300)
                promise?.resolve(true)
            } catch (e: Exception) {
                promise?.resolve(false)
            }
        }
    }

    private fun playToneSequence() {
        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_ALARM, 100)
            toneGen.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 800)
        } catch (e: Exception) {}
    }

    private fun stopAlertInternal() {
        try {
            if (currentRingtone != null && currentRingtone?.isPlaying == true) {
                currentRingtone?.stop()
            }
            currentRingtone = null
            if (mediaPlayer != null) {
                if (mediaPlayer?.isPlaying == true) {
                    mediaPlayer?.stop()
                }
                mediaPlayer?.release()
                mediaPlayer = null
            }
            isPlaying = false

            val vibrator = getVibrator()
            vibrator?.cancel()
        } catch (e: Exception) {}
    }

    private fun triggerVibrationInternal() {
        try {
            val vibrator = getVibrator()
            val pattern = longArrayOf(0, 500, 200, 500, 200, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, -1)
            }
        } catch (e: Exception) {}
    }

    private fun getVibrator(): Vibrator? {
        val context = reactApplicationContext
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }
}
