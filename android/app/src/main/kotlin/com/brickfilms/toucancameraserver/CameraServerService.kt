package com.brickfilms.toucancameraserver

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.OrientationEventListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.IllegalFormatException
import java.util.concurrent.atomic.AtomicReference

/**
 * Foreground service owning the native HTTP camera server.
 *
 * The class name and package are not a choice: the `.so` exports JNI short names
 * (`Java_com_brickfilms_toucancameraserver_CameraServerService_*`) and registers
 * nothing dynamically, so the `external` declarations have to live in exactly this
 * fully qualified name whatever the host app's own package is. Declaring them
 * elsewhere compiles and throws `UnsatisfiedLinkError` on the first call.
 *
 * The native library is the single source of truth: [startServer] returns the port
 * it actually bound (or a negative error code) and [serverStatusJson] reports the
 * live state. Nothing here assumes the server is up, nor which port it got.
 *
 * The service is only needed to keep the server alive while the app is not on
 * screen, and to carry its notification. The native entry points are plain statics,
 * so a host that wants neither — a foreground service must show a notification — can
 * call [startServer] / [stopServer] directly and never start this service.
 * ToucanCameraServer does exactly that when the server is not exposed.
 */
class CameraServerService : Service() {

    /** [startServer] blocks until the socket is bound, so it never runs on the main thread. */
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /** Notification wording for this run; null fields fall back to the DEFAULT_* constants. */
    private var notificationText = NotificationText()

    /**
     * Wording of the foreground notification, supplied by the host app — there are
     * no string resources here, so that this file stays a drop-in copy of the
     * reference implementation.
     *
     * [running] may contain `%1$d`, replaced by the port actually bound; a template
     * without it is shown as-is.
     *
     * [smallIcon] is a drawable of the host app — this file holds no resources of its
     * own — and falls back to a stock camera glyph when left at 0. The status bar
     * keeps only its alpha channel, so it has to be a white-on-transparent silhouette
     * filling its canvas.
     */
    data class NotificationText @JvmOverloads constructor(
        val title: String? = null,
        val starting: String? = null,
        val running: String? = null,
        val smallIcon: Int = 0,
    )

    companion object {
        const val DEFAULT_PORT = 8040

        /** Negative [startServer] results — see `android_jni` in the server's `src/lib.rs`. */
        const val ERR_RUNTIME = -1
        const val ERR_BIND = -2
        const val ERR_PANIC = -3

        private const val CHANNEL_ID = "camera_server"
        private const val NOTIF_ID = 1
        private const val EXTRA_PORT = "port"
        private const val EXTRA_TOKEN = "token"
        private const val EXTRA_EXPOSE = "expose"
        private const val EXTRA_NOTIF_TITLE = "notif_title"
        private const val EXTRA_NOTIF_STARTING = "notif_starting"
        private const val EXTRA_NOTIF_RUNNING = "notif_running"
        private const val EXTRA_NOTIF_ICON = "notif_icon"

        private const val DEFAULT_TITLE = "Camera server"
        private const val DEFAULT_STARTING = "Starting..."
        private const val DEFAULT_RUNNING = "Running on port %1\$d"

        init {
            System.loadLibrary("toucan_camera")
        }

        // -------------------------------------------------------------------
        // Native surface (the server's src/lib.rs, module `android_jni`)
        // -------------------------------------------------------------------

        /**
         * Starts the server and returns the port it listens on — which may differ
         * from [port] if that one was taken — or a negative `ERR_*` code.
         * Pass `port <= 0` for the default and an empty [token] to keep the one
         * already set by [setToken]. Blocks until the socket is bound.
         *
         * [expose] picks the bind address: `true` binds `0.0.0.0`, so other devices
         * on the network can reach the API; `false` binds `127.0.0.1`, reachable
         * only from this device.
         *
         * On a server that is already running: an identical [port] and [expose]
         * change nothing and return the live port; a different [token] is applied
         * in place; a different [port] or [expose] **rebinds** — the socket has to
         * be reopened, so every connection is dropped and the camera sessions are
         * released.
         */
        @JvmStatic external fun startServer(port: Int, token: String, expose: Boolean): Int

        /**
         * Stops the server and releases every camera session, so the next
         * [startServer] finds the hardware free. Blocks (bounded, 5 s worst case)
         * until the native server thread has wound down.
         */
        @JvmStatic external fun stopServer()

        /** Whether the native server is bound right now. */
        @JvmStatic external fun isServerRunning(): Boolean

        /** The live status as JSON — see [ServerState.fromJson]. */
        @JvmStatic external fun serverStatusJson(): String

        /** Replaces the pairing token; effective immediately on a running server. */
        @JvmStatic external fun setToken(token: String)

        /**
         * Reports how the device is currently held, so the cameras hand out
         * upright live-view frames and stills.
         *
         * [degrees] is the raw 0-359 value of [OrientationEventListener] — **not**
         * a `Surface.ROTATION_*` constant, whose sign is the opposite — or
         * [OrientationEventListener.ORIENTATION_UNKNOWN] (-1) when the device is
         * flat and has no meaningful "up", which disables rotation.
         *
         * The native side cannot read this itself: the NDK exposes no device
         * orientation, so this call is the only way it ever learns about one. This
         * service already feeds it from the accelerometer while it runs, so a host
         * app normally needs nothing; call it directly only to drive the
         * orientation from your own source (a locked activity orientation, a
         * gimbal, a remote UI) — which is what the app does when the server runs
         * in process, without this service.
         *
         * Cheap — one atomic store — and safe to call on every sensor event. Each
         * camera then exposes a `rotate_auto` parameter (on by default) a client
         * can turn off to get the sensor's native framing back.
         */
        @JvmStatic external fun setDeviceRotation(degrees: Int)

        // -------------------------------------------------------------------
        // Service state
        // -------------------------------------------------------------------

        /**
         * Whether the server currently runs inside this foreground service, as
         * opposed to directly in the app process. Tells the two run modes apart:
         * [isServerRunning] is true in both.
         */
        @Volatile
        @JvmStatic
        var isServiceRunning = false
            private set

        // Invoked once, on the main thread, when the matching call resolves. An
        // AtomicReference (not a list): a second start/stop before the first
        // resolves supersedes it, which is also what the caller would expect.
        private val pendingStart = AtomicReference<ServerCallback?>(null)
        private val pendingStop = AtomicReference<ServerCallback?>(null)

        private fun resolve(slot: AtomicReference<ServerCallback?>, state: ServerState) {
            val callback = slot.getAndSet(null) ?: return
            Handler(Looper.getMainLooper()).post { callback.onResult(state) }
        }

        /** Reads the native status. Cheap — nothing is enumerated — so poll freely. */
        @JvmStatic
        fun status(): ServerState = ServerState.fromJson(serverStatusJson())

        /**
         * Starts the server in its foreground service.
         *
         * [callback] fires once on the main thread with the resulting state —
         * running on [ServerState.port], or [ServerPhase.Failed] with
         * [ServerState.error] set.
         *
         * Calling this again on a running server refreshes the notification, and is
         * how [notification] is changed while it runs. An identical [port] /
         * [expose] leave the server untouched; a different one rebinds it (see
         * [startServer]), which drops the connections in flight.
         */
        @JvmStatic
        @JvmOverloads
        fun start(
            context: Context,
            token: String,
            port: Int = DEFAULT_PORT,
            expose: Boolean = true,
            notification: NotificationText? = null,
            callback: ServerCallback? = null,
        ) {
            pendingStart.set(callback)
            val intent = Intent(context, CameraServerService::class.java)
                .putExtra(EXTRA_PORT, port)
                .putExtra(EXTRA_TOKEN, token)
                .putExtra(EXTRA_EXPOSE, expose)
                .putExtra(EXTRA_NOTIF_TITLE, notification?.title)
                .putExtra(EXTRA_NOTIF_STARTING, notification?.starting)
                .putExtra(EXTRA_NOTIF_RUNNING, notification?.running)
                .putExtra(EXTRA_NOTIF_ICON, notification?.smallIcon ?: 0)
            context.startForegroundService(intent)
        }

        /**
         * Stops the server and its foreground service.
         *
         * [callback] fires once on the main thread once the teardown is done — that
         * is, once the camera sessions are released, so a caller that wants the
         * camera for itself can wait for it. Stopping an already stopped service
         * calls back immediately.
         */
        @JvmStatic
        @JvmOverloads
        fun stop(context: Context, callback: ServerCallback? = null) {
            if (!isServiceRunning) {
                // No service to destroy, so nothing would ever resolve the callback.
                callback?.let { resolve(AtomicReference(it), status()) }
                return
            }
            pendingStop.set(callback)
            context.stopService(Intent(context, CameraServerService::class.java))
        }

        /**
         * Rounds a raw accelerometer angle to 0, 90, 180 or 270, keeping [current]
         * until the device is a good 15 degrees past the boundary.
         *
         * Without that hysteresis a phone held near 45 degrees would flip the whole
         * live view back and forth on sensor noise alone.
         */
        @JvmStatic
        fun quantizeOrientation(orientation: Int, current: Int): Int {
            if (orientation == OrientationEventListener.ORIENTATION_UNKNOWN) {
                return OrientationEventListener.ORIENTATION_UNKNOWN
            }
            val degrees = ((orientation % 360) + 360) % 360
            val candidate = (degrees + 45) / 90 * 90 % 360
            if (current == OrientationEventListener.ORIENTATION_UNKNOWN) return candidate
            if (candidate == current) return current
            // Angular distance to the quarter turn currently in force.
            val delta = Math.abs(degrees - current).let { if (it > 180) 360 - it else it }
            return if (delta > 60) candidate else current
        }

        /** Fallback wording when the native side reported no message of its own. */
        @JvmStatic
        fun errorMessage(code: Int): String = when (code) {
            ERR_BIND -> "No network port available"
            ERR_RUNTIME -> "The server could not start"
            ERR_PANIC -> "The server crashed while starting"
            else -> "Unknown error ($code)"
        }
    }

    /**
     * Feeds the native side the device orientation, quantized to a quarter turn.
     *
     * Deliberately driven by the accelerometer rather than `Display.rotation`: a
     * phone acting as a camera server is usually locked to portrait (and its
     * activity often not even in the foreground), so `Display.rotation` would
     * never move while the phone physically does.
     */
    private var orientationListener: OrientationEventListener? = null

    /** Last quarter turn reported, so unchanged readings cost nothing. */
    private var reportedOrientation = OrientationEventListener.ORIENTATION_UNKNOWN

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startWatchingOrientation()
    }

    private fun startWatchingOrientation() {
        if (orientationListener != null) return
        val listener = object : OrientationEventListener(this) {
            override fun onOrientationChanged(orientation: Int) {
                val next = quantizeOrientation(orientation, reportedOrientation)
                if (next == reportedOrientation) return
                reportedOrientation = next
                setDeviceRotation(next)
            }
        }
        // False when the device has no accelerometer: the orientation then stays
        // unknown, which simply means no rotation is applied.
        if (listener.canDetectOrientation()) {
            listener.enable()
            orientationListener = listener
        }
    }

    private fun stopWatchingOrientation() {
        orientationListener?.disable()
        orientationListener = null
        reportedOrientation = OrientationEventListener.ORIENTATION_UNKNOWN
        setDeviceRotation(OrientationEventListener.ORIENTATION_UNKNOWN)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val port = intent?.getIntExtra(EXTRA_PORT, DEFAULT_PORT) ?: DEFAULT_PORT
        val token = intent?.getStringExtra(EXTRA_TOKEN).orEmpty()
        val expose = intent?.getBooleanExtra(EXTRA_EXPOSE, true) ?: true

        notificationText = NotificationText(
            title = intent?.getStringExtra(EXTRA_NOTIF_TITLE),
            starting = intent?.getStringExtra(EXTRA_NOTIF_STARTING),
            running = intent?.getStringExtra(EXTRA_NOTIF_RUNNING),
            smallIcon = intent?.getIntExtra(EXTRA_NOTIF_ICON, 0) ?: 0,
        )

        // The foreground notification must go up straight away, before the bind.
        // A restart on an already-running server keeps showing its real port
        // instead of flashing the starting line — this path is also how the
        // wording gets refreshed at runtime.
        val liveState = status()
        startInForeground(
            if (liveState.isRunning) buildNotification(runningText(liveState.port))
            else buildNotification(startingText())
        )
        isServiceRunning = true

        scope.launch {
            val result = startServer(port, token, expose)
            val current = status()
            if (result >= 0) {
                updateNotification(buildNotification(runningText(current.port)))
                resolve(pendingStart, current)
            } else {
                // Prefer the native message; fall back to the error code.
                resolve(
                    pendingStart,
                    current.copy(phase = ServerPhase.Failed, error = current.error ?: errorMessage(result)),
                )
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        isServiceRunning = false
        // Synchronous on purpose: it releases the camera sessions, and the next
        // start must not race a body that is still claimed. Bounded on the native
        // side (5 s worst case) so this cannot hang the service teardown.
        stopServer()
        stopWatchingOrientation()
        resolve(pendingStop, status())
        scope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startInForeground(notification: Notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA)
        } else {
            startForeground(NOTIF_ID, notification)
        }
    }

    private fun updateNotification(notification: Notification) {
        getSystemService(NotificationManager::class.java).notify(NOTIF_ID, notification)
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            DEFAULT_TITLE,
            NotificationManager.IMPORTANCE_LOW,
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun startingText(): String = notificationText.starting ?: DEFAULT_STARTING

    /**
     * The running line, with the port substituted. A caller-supplied template
     * carrying a bad format specifier is shown raw rather than taking the service
     * down — a notification is not worth an exception.
     */
    private fun runningText(port: Int): String {
        val template = notificationText.running ?: DEFAULT_RUNNING
        return try {
            String.format(template, port)
        } catch (e: IllegalFormatException) {
            template
        }
    }

    private fun buildNotification(text: String): Notification =
        Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(notificationText.title ?: DEFAULT_TITLE)
            .setContentText(text)
            .setStyle(Notification.BigTextStyle().bigText(text))
            .setSmallIcon(if (notificationText.smallIcon != 0) notificationText.smallIcon else android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setContentIntent(launchAppIntent())
            .build()

    /** Tapping the notification brings the host app back up, whatever its package. */
    private fun launchAppIntent(): PendingIntent? {
        val launch = packageManager.getLaunchIntentForPackage(packageName) ?: return null
        return PendingIntent.getActivity(this, 0, launch, PendingIntent.FLAG_IMMUTABLE)
    }
}
