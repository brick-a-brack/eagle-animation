package com.brickabrack.eagleanimation

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import com.brickabrack.eagleanimation.actions.ActionDispatcher
import com.brickabrack.eagleanimation.bridge.EAJSBridge
import com.brickabrack.eagleanimation.storage.ProjectStorage
import com.brickabrack.eagleanimation.storage.SettingsStorage
import com.brickabrack.eagleanimation.webview.EAWebViewClient
import com.brickfilms.toucancameraserver.CameraServerService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var bridge: EAJSBridge
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val cameraServerToken = UUID.randomUUID().toString()

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) startCameraServer()
    }

    /**
     * Mirrors the Electron preload: exposes window.IPC.call / window.IPC.stream
     * before any page script runs so config.js sees window.IPC → DEVICE = 'ELECTRON'.
     *
     * DEVICE='ELECTRON' activates ToucanCameraServer module instead of getUserMedia.
     *
     * ArrayBuffer / TypedArray values are serialised as { __b64: "<base64>" } so they
     * survive the JSON round-trip to Kotlin (ActionDispatcher decodes them).
     */
    private val ipcScript = """
        (function () {
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

        val projectsDir = (getExternalFilesDir(null) ?: filesDir)
            .resolve("EagleAnimation")
            .also { it.mkdirs() }

        val dispatcher = ActionDispatcher(
            context = this,
            projectStorage = ProjectStorage(projectsDir),
            settingsStorage = SettingsStorage(projectsDir),
            cameraServerToken = cameraServerToken,
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
        webView.webViewClient = EAWebViewClient(projectsDir, assetLoader)

        if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            WebViewCompat.addDocumentStartJavaScript(webView, ipcScript, setOf("*"))
        }

        // Start camera server (requests permission first if needed)
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            startCameraServer()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        webView.loadUrl("https://appassets.androidplatform.net/index.html")
    }

    private fun startCameraServer() {
        CameraServerService.setToken(cameraServerToken)
        startForegroundService(Intent(this, CameraServerService::class.java))
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
