package com.brickabrack.eagleanimation.webview

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
) : WebViewClient() {

    override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
        val uri = request?.url ?: return null

        // ea://api/pictures/{projectId}/{sceneIndex}/{filename}?w=&h=&f=&m=&q=&i=
        if (uri.scheme?.lowercase() == "ea") {
            val segments = uri.pathSegments
            Log.d("EAWebView", "ea:// intercept: host=${uri.host} segments=$segments")
            if (uri.host == "api" && segments.size >= 4 && segments[0] == "pictures") {
                val imageFile = projectsDir
                    .resolve(segments[1])
                    .resolve(segments[2])
                    .resolve(segments[3])
                Log.d("EAWebView", "image path=${imageFile.absolutePath} exists=${imageFile.exists()} size=${if (imageFile.exists()) imageFile.length() else -1}")
                return if (imageFile.exists()) {
                    ImageProcessor.process(imageFile, uri)
                } else {
                    WebResourceResponse("application/json", "utf-8", 404, "Not Found", emptyMap(), "null".byteInputStream())
                }
            }
            return null
        }

        return assetLoader.shouldInterceptRequest(uri)
    }
}
