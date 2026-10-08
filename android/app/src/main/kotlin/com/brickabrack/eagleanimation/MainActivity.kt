package com.brickabrack.eagleanimation

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.webkit.PermissionRequest
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.ScriptHandler
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.brickabrack.eagleanimation.actions.ActionDispatcher
import com.brickabrack.eagleanimation.bridge.EAJSBridge
import com.brickabrack.eagleanimation.camera.ToucanCameraServer
import com.brickabrack.eagleanimation.storage.ProjectStorage
import com.brickabrack.eagleanimation.storage.SettingsStorage
import com.brickabrack.eagleanimation.webview.EAWebChromeClient
import com.brickabrack.eagleanimation.image.ResizeCache
import com.brickabrack.eagleanimation.webview.EAWebViewClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var bridge: EAJSBridge
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    /** Latest safe-area JS snippet, replayed on every page load. */
    private var safeAreaScript: String? = null

    /** Document-start registration of [safeAreaScript], replaced whenever the insets change. */
    private var safeAreaScriptHandler: ScriptHandler? = null

    /** Cleared once the page has been asked for, so it is only ever loaded once. */
    private var isPageLoadPending = true

    /** Capture request from the live view, parked while the user answers the Android dialog. */
    private var pendingMediaRequest: PermissionRequest? = null

    // Asked for up front so the live view and the camera server never have to stop
    // and ask mid-capture. Nothing is started here: the renderer owns the camera
    // server and brings it up through TOUCAN_CAMERA_SERVER_SET_CONFIG.
    private val startupPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { }

    private val mediaCapturePermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { _ ->
        pendingMediaRequest?.let { answerMediaRequest(it) }
        pendingMediaRequest = null
    }

    /**
     * Mirrors the Electron preload: exposes window.IPC.call / window.IPC.stream
     * before any page script runs, plus window.DEVICE, the override config.js reads
     * before falling back to detection.
     *
     * DEVICE has to be 'ANDROID' and not 'ELECTRON': the renderer keys its capture
     * fast path on it, where Kotlin fetches the JPEG straight from the local camera
     * server instead of carrying ~30 MB of base64 across the Binder bridge.
     *
     * ArrayBuffer / TypedArray values are serialised as { __b64: "<base64>" } so they
     * survive the JSON round-trip to Kotlin (ActionDispatcher decodes them).
     */
    private val ipcScript = """
        (function () {
            window.DEVICE = 'ANDROID';

            if (window.IPC) return;

            var _pending = {};
            var _streams  = {};

            window.__ea_resolve = function (id, result) {
                var p = _pending[id]; if (p) { p.resolve(result); delete _pending[id]; }
            };
            window.__ea_reject = function (id, msg) {
                var p = _pending[id]; if (p) { p.reject(new Error(msg)); delete _pending[id]; }
            };
            window.__ea_event = function (name, data) {
                (_streams[name] || []).forEach(function (cb) { try { cb(name, data); } catch (e) {} });
            };

            function toBase64(bytes) {
                // Process in 8 KB chunks — String.fromCharCode.apply is O(n) per chunk
                var CHUNK = 8192, s = '', i = 0;
                for (; i + CHUNK < bytes.length; i += CHUNK)
                    s += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
                s += String.fromCharCode.apply(null, bytes.subarray(i));
                return btoa(s);
            }

            function serializeBuffers(k, v) {
                if (v instanceof ArrayBuffer)
                    return { __b64: toBase64(new Uint8Array(v)) };
                if (v && ArrayBuffer.isView(v))
                    return { __b64: toBase64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
                return v;
            }

            var CHUNK_SIZE = 512 * 1024; // 512 KB — safely under Android Binder 1 MB limit

            window.IPC = {
                call: function (action, data) {
                    return new Promise(function (resolve, reject) {
                        var id = Math.random().toString(36).slice(2) + Date.now();
                        _pending[id] = { resolve: resolve, reject: reject };
                        var json = JSON.stringify(data || {}, serializeBuffers);
                        console.log('[IPC] call', action, 'jsonLen=' + json.length);
                        if (json.length <= CHUNK_SIZE) {
                            AndroidIPC.call(id, action, json);
                        } else {
                            var total = Math.ceil(json.length / CHUNK_SIZE);
                            console.log('[IPC] chunking', action, 'into', total, 'chunks');
                            for (var i = 0; i < total; i++) {
                                AndroidIPC.callChunk(id, action, i, total,
                                    json.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
                            }
                        }
                    });
                },
                stream: function (name, cb) {
                    if (!_streams[name]) _streams[name] = [];
                    _streams[name].push(cb);
                }
            };
        })();
    """.trimIndent()

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        enableImmersiveMode()

        val projectsDir = (getExternalFilesDir(null) ?: filesDir)
            .resolve("EagleAnimation")
            .also { it.mkdirs() }

        // Resized frames live in the app cache directory, not next to the projects:
        // Android may reclaim it under storage pressure, and losing an entry only
        // costs one resize.
        val resizeCache = ResizeCache(cacheDir.resolve("resizer"))

        val dispatcher = ActionDispatcher(
            context = this,
            projectStorage = ProjectStorage(projectsDir),
            settingsStorage = SettingsStorage(projectsDir),
            resizeCache = resizeCache,
        )

        WebView.setWebContentsDebuggingEnabled(true)
        webView = WebView(this)
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
        }

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        bridge = EAJSBridge(webView, scope, dispatcher)
        webView.addJavascriptInterface(bridge, "AndroidIPC")
        webView.webViewClient = EAWebViewClient(projectsDir, assetLoader, ipcScript, resizeCache) { pushSafeArea() }
        webView.webChromeClient = EAWebChromeClient { handleMediaRequest(it) }

        observeSafeArea()

        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(webView, ipcScript, setOf("*"))
        }

        val missingPermissions = startupPermissions.filterNot { isGranted(it) }
        if (missingPermissions.isNotEmpty()) {
            startupPermissionLauncher.launch(missingPermissions.toTypedArray())
        }

        // The page is loaded from the first window-insets dispatch (see observeSafeArea),
        // not here, so --safe-area-* is known before anything paints. This is only the
        // backstop for a window that never dispatches any: the WebView is blank until
        // then, so the wait costs nothing visible.
        webView.postDelayed({ loadPageOnce() }, SAFE_AREA_WAIT_MS)
    }

    /**
     * Full screen: the app draws edge-to-edge and both system bars (status bar and
     * navigation bar / gesture pill) stay hidden. A swipe from an edge reveals them
     * transiently, then they auto-hide again.
     */
    private fun enableImmersiveMode() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            hide(WindowInsetsCompat.Type.systemBars())
        }
    }

    override fun onStart() {
        super.onStart()
        // Nothing stops the server from outside the app any more, but it can still
        // have died on its own (a crash, the camera claimed by another app): coming
        // back to the app is where that gets put right.
        scope.launch { ToucanCameraServer.restoreIfStopped(this@MainActivity) }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        // Re-hide the bars after a permission dialog, keyboard or app switch brought them back
        if (hasFocus) enableImmersiveMode()
    }

    /**
     * Exposes the window insets (display cutout / camera hole, plus the system bars
     * whenever they are visible) to the renderer as CSS custom properties on <html>:
     * --safe-area-top / -right / -bottom / -left.
     *
     * WebView does not reliably resolve env(safe-area-inset-*) for display cutouts,
     * so the native values are pushed instead; vars.css keeps env() as the default.
     *
     * The values have to be in place before the first paint, or the layout is drawn
     * flush against the cutout and jumps as soon as they land. Two things ensure that:
     * the snippet is registered as a document-start script, which runs before the page
     * scripts and sets the properties inline on <html> — where they outrank the :root
     * rule in vars.css whatever the order — and the page is only loaded once the first
     * insets have been dispatched here.
     */
    private fun observeSafeArea() {
        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
            val safe = insets.getInsets(
                WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.systemBars()
            )
            val density = resources.displayMetrics.density
            fun css(px: Int) = "${px / density}px"

            safeAreaScript = """
                (function () {
                    var s = document.documentElement.style;
                    s.setProperty('--safe-area-top', '${css(safe.top)}');
                    s.setProperty('--safe-area-right', '${css(safe.right)}');
                    s.setProperty('--safe-area-bottom', '${css(safe.bottom)}');
                    s.setProperty('--safe-area-left', '${css(safe.left)}');
                })();
            """.trimIndent()

            registerSafeAreaDocumentScript()
            // Updates a page that is already up: rotation, or the bars swiped into view.
            pushSafeArea()
            // First dispatch: the values are known, the page can be drawn with them.
            loadPageOnce()
            insets
        }
    }

    private fun pushSafeArea() {
        safeAreaScript?.let { webView.evaluateJavascript(it, null) }
    }

    /**
     * (Re)registers the safe-area snippet so every document starts with the current
     * values. The registration carries a fixed script, so a change means replacing it.
     */
    private fun registerSafeAreaDocumentScript() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            return
        }
        val script = safeAreaScript ?: return
        safeAreaScriptHandler?.remove()
        safeAreaScriptHandler = WebViewCompat.addDocumentStartJavaScript(webView, script, setOf("*"))
    }

    private fun loadPageOnce() {
        if (!isPageLoadPending) {
            return
        }
        isPageLoadPending = false
        webView.loadUrl(START_URL)
    }

    /**
     * Answers a live view capture request: resources whose Android permission is
     * still missing are asked for first, then the request is answered once.
     */
    private fun handleMediaRequest(request: PermissionRequest) {
        val missing = request.resources
            .mapNotNull { androidPermissionFor(it) }
            .distinct()
            .filterNot { isGranted(it) }

        if (missing.isEmpty()) {
            answerMediaRequest(request)
        } else {
            pendingMediaRequest = request
            mediaCapturePermissionLauncher.launch(missing.toTypedArray())
        }
    }

    /** Grants every requested resource backed by a granted permission, denies the rest. */
    private fun answerMediaRequest(request: PermissionRequest) {
        val granted = request.resources.filter { resource ->
            androidPermissionFor(resource)?.let { isGranted(it) } == true
        }
        if (granted.isEmpty()) request.deny() else request.grant(granted.toTypedArray())
    }

    private fun androidPermissionFor(resource: String): String? = when (resource) {
        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA
        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO
        else -> null
    }

    private fun isGranted(permission: String) =
        ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    override fun onDestroy() {
        // The camera server never outlives the app: it goes down with the window
        // rather than holding the camera for one that no longer exists.
        var hadServer = false
        if (isFinishing) {
            hadServer = ToucanCameraServer.releaseOnExit(this)
            scope.cancel()
        }
        super.onDestroy()
        // Stopping the server is not enough to free the camera: the native library
        // keeps the device open, and the process stays cached with no window left, so
        // the system still shows the camera as in use. Only its death releases it.
        if (hadServer) {
            Process.killProcess(Process.myPid())
        }
    }

    /**
     * POST_NOTIFICATIONS only exists from Android 13, and only matters there: without
     * it the camera server's ongoing notification is dropped silently, leaving camera
     * sharing with no way to show its address and pairing code.
     */
    private companion object {
        const val START_URL = "https://appassets.androidplatform.net/index.html"

        /** How long the page waits for a first insets dispatch before loading anyway. */
        const val SAFE_AREA_WAIT_MS = 300L
    }

    private val startupPermissions: Array<String>
        get() = buildList {
            add(Manifest.permission.CAMERA)
            add(Manifest.permission.RECORD_AUDIO)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }.toTypedArray()
}
