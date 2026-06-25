package com.brickabrack.eagleanimation.bridge

import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.brickabrack.eagleanimation.actions.ActionDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

class EAJSBridge(
    private val webView: WebView,
    private val scope: CoroutineScope,
    private val dispatcher: ActionDispatcher,
) {

    // Accumulate chunked payloads: callbackId → Array<String?> of size totalChunks
    private val pendingChunks = ConcurrentHashMap<String, Pair<String, Array<String?>>>()

    @JavascriptInterface
    fun call(callbackId: String, action: String, dataJson: String) {
        Log.d("EAJSBridge", "call: action=$action jsonLen=${dataJson.length}")
        scope.launch {
            try {
                val data = runCatching { JSONObject(dataJson) }.getOrElse { JSONObject() }
                val result = dispatcher.dispatch(action, data) { name, eventData ->
                    val payload = eventData.toString()
                    webView.post {
                        webView.evaluateJavascript(
                            "if(window.__ea_event)window.__ea_event(${quote(name)},$payload);", null
                        )
                    }
                }
                val json = serializeResult(result)
                withContext(Dispatchers.Main) {
                    webView.evaluateJavascript("window.__ea_resolve(${quote(callbackId)},$json);", null)
                }
            } catch (e: Exception) {
                Log.e("EAJSBridge", "Action $action failed", e)
                withContext(Dispatchers.Main) {
                    webView.evaluateJavascript("window.__ea_reject(${quote(callbackId)},${quote(e.message ?: "error")});", null)
                }
            }
        }
    }

    // Called for large payloads split into CHUNK_SIZE pieces by the JS bridge.
    // Once all chunks arrive, reassembled and dispatched via call().
    @JavascriptInterface
    fun callChunk(callbackId: String, action: String, chunkIndex: Int, totalChunks: Int, chunkData: String) {
        Log.d("EAJSBridge", "callChunk: action=$action chunk=$chunkIndex/$totalChunks len=${chunkData.length}")
        val chunks = pendingChunks.getOrPut(callbackId) { Pair(action, Array(totalChunks) { null }) }.second
        chunks[chunkIndex] = chunkData
        if (chunks.none { it == null }) {
            Log.d("EAJSBridge", "callChunk: all $totalChunks chunks received for $action, reassembling")
            pendingChunks.remove(callbackId)
            val fullJson = chunks.joinToString("")
            Log.d("EAJSBridge", "callChunk: full json len=${fullJson.length}")
            call(callbackId, action, fullJson)
        }
    }

    fun sendEvent(name: String, data: JSONObject) {
        val json = data.toString()
        webView.post {
            webView.evaluateJavascript("if(window.__ea_event)window.__ea_event(${quote(name)},$json);", null)
        }
    }

    private fun serializeResult(result: Any?): String = when (result) {
        null -> "null"
        is JSONObject -> result.toString()
        is JSONArray -> result.toString()
        is String -> JSONObject.quote(result)
        is Number, is Boolean -> result.toString()
        else -> "null"
    }

    private fun quote(s: String) = JSONObject.quote(s)
}
