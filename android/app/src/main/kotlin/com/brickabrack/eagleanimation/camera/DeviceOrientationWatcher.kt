package com.brickabrack.eagleanimation.camera

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.OrientationEventListener
import com.brickfilms.toucancameraserver.CameraServerService

/**
 * Feeds the native camera server the device orientation while it runs **in the app
 * process**, so its frames and stills come out upright.
 *
 * [CameraServerService] does exactly this on its own, but only while the foreground
 * service exists — and Eagle Animation skips that service whenever the camera is not
 * shared, which is the default. Nothing would then ever report an orientation, and
 * the native side cannot read one itself: the NDK exposes no device orientation.
 *
 * The accelerometer is the source rather than `Display.rotation` so a rotation is
 * picked up even while the activity is not on screen, and so it keeps working if the
 * window is ever orientation-locked.
 */
object DeviceOrientationWatcher {

    private const val TAG = "ToucanCameraServer"

    private var listener: OrientationEventListener? = null

    /** Last quarter turn reported, so unchanged readings cost nothing. */
    private var reported = OrientationEventListener.ORIENTATION_UNKNOWN

    fun start(context: Context) = onMainThread {
        if (listener != null) {
            return@onMainThread
        }
        val created = object : OrientationEventListener(context.applicationContext) {
            override fun onOrientationChanged(orientation: Int) {
                val next = CameraServerService.quantizeOrientation(orientation, reported)
                if (next == reported) {
                    return
                }
                reported = next
                Log.d(TAG, "Reporting device orientation $next to the camera server")
                CameraServerService.setDeviceRotation(next)
            }
        }
        // False when the device has no accelerometer: the orientation then stays
        // unknown, which simply means no rotation is applied.
        if (created.canDetectOrientation()) {
            created.enable()
            listener = created
        }
    }

    /** The server is going down: the native side must forget the orientation too. */
    fun stop() = onMainThread {
        release()
        Log.d(TAG, "Clearing the device orientation reported to the camera server")
        CameraServerService.setDeviceRotation(OrientationEventListener.ORIENTATION_UNKNOWN)
    }

    /**
     * Hands the orientation over to [CameraServerService], which watches it itself.
     *
     * Unlike [stop] this leaves the value the native side already holds alone: the
     * service only reports changes, so blanking it here would leave the server with
     * no orientation at all until the device next physically moves.
     */
    fun handOver() = onMainThread {
        release()
    }

    private fun release() {
        listener?.disable()
        listener = null
        reported = OrientationEventListener.ORIENTATION_UNKNOWN
    }

    // The listener registers a sensor callback, so it is kept on one thread.
    private fun onMainThread(block: () -> Unit) {
        if (Looper.myLooper() == Looper.getMainLooper()) {
            block()
        } else {
            Handler(Looper.getMainLooper()).post(block)
        }
    }
}
