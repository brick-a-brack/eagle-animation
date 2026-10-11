package com.brickabrack.eagleanimation.webview

import android.webkit.PermissionRequest
import android.webkit.WebChromeClient

/**
 * A WebView denies camera / microphone capture by default, even when the app
 * already holds the matching Android permissions, so every getUserMedia call
 * from the live view arrives here and has to be answered explicitly.
 */
class EAWebChromeClient(
    private val onMediaRequest: (PermissionRequest) -> Unit,
) : WebChromeClient() {

    override fun onPermissionRequest(request: PermissionRequest) = onMediaRequest(request)

    override fun onPermissionRequestCanceled(request: PermissionRequest) = Unit
}
