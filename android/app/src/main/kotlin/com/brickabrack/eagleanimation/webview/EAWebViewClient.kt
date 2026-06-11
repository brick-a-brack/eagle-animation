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
