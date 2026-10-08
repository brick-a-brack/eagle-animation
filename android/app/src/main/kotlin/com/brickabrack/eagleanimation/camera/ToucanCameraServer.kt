package com.brickabrack.eagleanimation.camera

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.brickabrack.eagleanimation.R
import com.brickfilms.toucancameraserver.CameraServerService
import com.brickfilms.toucancameraserver.ServerState
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONObject
import java.net.NetworkInterface
import kotlin.coroutines.resume

/**
 * Drives the native Toucan Camera Server for the renderer — the Android
 * counterpart of src/backend-electron/core/toucan.js, and the only entry point
 * that ever starts it. Nothing is listening until the renderer sends a first
 * TOUCAN_CAMERA_SERVER_SET_CONFIG, exactly like the desktop binary.
 *
 * Two run modes, picked by `expose`:
 *
 *  - exposed: the server runs in [CameraServerService], a foreground service showing
 *    an ongoing notification with the address and the pairing code — the only place
 *    to read them once the app is off screen.
 *  - not exposed: the server runs straight in the app process, with no service and
 *    therefore no notification, since a foreground service must show one. Nothing
 *    needs pairing: only this device can reach the server.
 *
 * Either way the server goes down with the app, in [releaseOnExit]: it exists to
 * serve this window, not to outlive it.
 *
 * Both modes drive the same native singleton, so switching between them hands the
 * server over rather than running two.
 */
object ToucanCameraServer {

    private const val TAG = "ToucanCameraServer"
    private const val LOOPBACK = "127.0.0.1"

    /** Enough for the bind plus the service start; the native side has no timeout of its own. */
    private const val READY_TIMEOUT_MS = 20_000L

    /** Option owned by the renderer through SET_CONFIG. */
    private var expose = false

    /**
     * Whether the renderer asked for a server at all. Survives a stop from the
     * notification, so returning to the app can bring the server back.
     */
    private var isWanted = false

    /**
     * Pairing code last asked for. Only kept to put it in the notification: the
     * token the server actually accepts is read back from the native status.
     */
    private var token = ""

    /**
     * Applies the sharing options and makes sure a server is running with them.
     * Resolves with the config of the server actually listening.
     */
    suspend fun setConfig(context: Context, expose: Boolean, token: String): JSONObject {
        this.expose = expose
        // An empty token keeps the current one — that is also what the native side does.
        this.token = token.ifBlank { this.token }
        isWanted = true

        // The service is what puts the notification up, so it runs exactly while the
        // server is exposed: that is when the address and the pairing code are worth
        // reading. A foreground service of type `camera` cannot start without the
        // permission, so without it the server simply lives in the app process.
        val useService = expose && hasCameraPermission(context)

        if (useService) {
            // The service watches the orientation itself, so the app's own watcher
            // has to go first or the two would fight over the native value. A
            // hand-over, not a stop: the orientation already reported stays in force.
            DeviceOrientationWatcher.handOver()
            startAsService(context)
        } else {
            // Running in the service: stopping it releases the native server too, so
            // it has to be started again in process.
            if (CameraServerService.isServiceRunning) {
                stopService(context)
            }
            startInProcess()
            DeviceOrientationWatcher.start(context)
        }

        return getConfig()
    }

    /**
     * Brings the server back when the app returns to the screen and nothing is
     * listening any more — it may have been stopped from the notification while the
     * app was away. The settings the renderer last asked for win over that ad-hoc
     * stop, so coming back into the app is also how sharing resumes.
     *
     * A no-op before the renderer has ever asked for a server, and on a server that
     * is already running.
     */
    suspend fun restoreIfStopped(context: Context) {
        if (!isWanted || CameraServerService.isServerRunning()) {
            return
        }
        Log.d(TAG, "Camera server was stopped while the app was away, bringing it back")
        setConfig(context, expose, token)
    }

    /**
     * Always returns the full shape expected by the renderer. `port` and `token`
     * are null while nothing is listening.
     *
     * Everything but the options is read back from the native library: the port it
     * actually bound may differ from the one that was asked for.
     *
     * `hostname` stays on the loopback even when exposed, because it is what the app
     * dials for its own live view: the renderer is served from an https origin, and
     * Chromium auto-upgrades an http `<img>` on a secure page to https — which this
     * plain-HTTP server refuses — for every address but the loopback, which counts
     * as trustworthy. `shareHostname` carries the address to hand to other devices.
     */
    fun getConfig(): JSONObject {
        val state = CameraServerService.status()
        val isListening = state.isRunning && state.port > 0
        val isExposed = if (state.isRunning) state.expose else expose
        return JSONObject().apply {
            put("hostname", LOOPBACK)
            put("shareHostname", shareHostname(isExposed))
            put("expose", isExposed)
            put("port", if (isListening) state.port else JSONObject.NULL)
            put("token", if (isListening && state.token.isNotEmpty()) state.token else JSONObject.NULL)
            put("secure", false) // the native server serves plain HTTP
        }
    }

    /**
     * Stops the server without preventing a later restart: the next [setConfig]
     * brings it back up. Used when the user turns camera sharing off.
     */
    suspend fun stop(context: Context): JSONObject {
        isWanted = false
        if (CameraServerService.isServiceRunning) {
            stopService(context)
        } else {
            stopInProcess()
        }
        DeviceOrientationWatcher.stop()
        return getConfig()
    }

    /**
     * Called when the activity is finishing: the server goes down with the window it
     * was serving, whether it runs in the service (which stops the native server from
     * its own onDestroy) or in the app process, where it would otherwise outlive the
     * activity.
     */
    fun releaseOnExit(context: Context) {
        if (CameraServerService.isServiceRunning) {
            Log.d(TAG, "Activity finishing, stopping the camera server service")
            CameraServerService.stop(context)
        } else if (CameraServerService.isServerRunning()) {
            Log.d(TAG, "Activity finishing, stopping the in-process camera server")
            CameraServerService.stopServer()
        }
        DeviceOrientationWatcher.stop()
    }

    private suspend fun startInProcess() = withContext(Dispatchers.IO) {
        // Idempotent: same port and expose leave a running server untouched, a new
        // token is applied in place, a changed expose rebinds.
        val result = CameraServerService.startServer(CameraServerService.DEFAULT_PORT, token, expose)
        if (result < 0) {
            Log.e(TAG, "Camera server failed to start: ${CameraServerService.errorMessage(result)}")
        } else {
            Log.d(TAG, "Camera server listening on port $result (expose=$expose)")
        }
    }

    private suspend fun stopInProcess() = withContext(Dispatchers.IO) {
        if (CameraServerService.isServerRunning()) {
            CameraServerService.stopServer()
        }
    }

    /**
     * Starts — or reconfigures — the foreground service. Also the path that refreshes
     * the notification, so the pairing code shown there follows a token rotation.
     */
    private suspend fun startAsService(context: Context): ServerState? =
        withTimeoutOrNull(READY_TIMEOUT_MS) {
            suspendCancellableCoroutine { continuation ->
                CameraServerService.start(
                    context = context,
                    token = token,
                    port = CameraServerService.DEFAULT_PORT,
                    expose = expose,
                    notification = notificationText(),
                ) { state ->
                    if (continuation.isActive) {
                        continuation.resume(state)
                    }
                }
            }
        }

    private suspend fun stopService(context: Context): ServerState? =
        withTimeoutOrNull(READY_TIMEOUT_MS) {
            suspendCancellableCoroutine { continuation ->
                CameraServerService.stop(context) { state ->
                    if (continuation.isActive) {
                        continuation.resume(state)
                    }
                }
            }
        }

    /**
     * The notification is the only place the address and the pairing code are
     * readable while the app is in the background, so it carries both. `%1$d` is
     * replaced by the port the server actually bound, which is the one value not yet
     * known when this is built.
     *
     * The address is resolved here, when sharing starts: should the device change
     * network afterwards, the line keeps the old one until the next SET_CONFIG.
     */
    private fun notificationText() = CameraServerService.NotificationText(
        title = "Eagle Animation - Camera sharing",
        starting = "Starting the camera server...",
        running = "${shareHostname()}:%1\$d" + if (token.isEmpty()) "" else " - $token",
        smallIcon = R.drawable.ic_notification,
    )

    /** The address to hand to other devices: only reachable from elsewhere once exposed. */
    private fun shareHostname(isExposed: Boolean = expose) = if (isExposed) lanAddress() else LOOPBACK

    private fun hasCameraPermission(context: Context) =
        ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED

    /**
     * Address other devices can reach when the server is exposed: it binds on
     * 0.0.0.0, which is not dialable, so the first non-internal IPv4 is reported.
     */
    private fun lanAddress(): String {
        val address = runCatching {
            NetworkInterface.getNetworkInterfaces()
                .asSequence()
                .filter { it.isUp && !it.isLoopback }
                .flatMap { it.inetAddresses.asSequence() }
                .firstOrNull { !it.isLoopbackAddress && it.address.size == 4 }
                ?.hostAddress
        }.getOrNull()
        return address ?: LOOPBACK
    }
}
