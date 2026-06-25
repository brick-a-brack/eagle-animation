package com.brickabrack.eagleanimation.webview

import android.graphics.Bitmap
import android.util.Log
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.webkit.WebViewAssetLoader
import com.brickabrack.eagleanimation.image.ImageProcessor
import java.io.File

class EAWebViewClient(
    private val projectsDir: File,
    private val assetLoader: WebViewAssetLoader,
    private val ipcScript: String,
) : WebViewClient() {

    // Fallback injection of the IPC bridge for WebViews that don't support
    // DOCUMENT_START_SCRIPT. Without window.IPC the renderer would resolve
    // DEVICE='WEB' and fall back to the web backend (which advertises
    // FULLSCREEN etc.) instead of the native Android backend. The script
    // guards itself with `if (window.IPC) return;`, so this is a no-op when
    // the document-start injection already ran.
    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        view?.evaluateJavascript(ipcScript, null)
    }

    override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
        val uri = request?.url ?: return null

        // https://appassets.androidplatform.net/api/pictures/{projectId}/{sceneIndex}/{filename}?...
        if (uri.scheme == "https" && uri.host == "appassets.androidplatform.net" &&
            uri.pathSegments.size >= 4 && uri.pathSegments[0] == "api" && uri.pathSegments[1] == "pictures"
        ) {
            val imageFile = projectsDir
                .resolve(uri.pathSegments[2])
                .resolve(uri.pathSegments[3])
                .resolve(uri.pathSegments[4])
            return if (imageFile.exists()) {
                ImageProcessor.process(imageFile, uri)
            } else {
                WebResourceResponse("application/json", "utf-8", 404, "Not Found", emptyMap(), "null".byteInputStream())
            }
        }

        return assetLoader.shouldInterceptRequest(uri)
    }
}
