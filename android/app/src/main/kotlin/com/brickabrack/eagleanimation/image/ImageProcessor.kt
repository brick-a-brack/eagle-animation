package com.brickabrack.eagleanimation.image

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.net.Uri
import android.webkit.WebResourceResponse
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File

object ImageProcessor {

    private val CORS_HEADERS = mapOf("Access-Control-Allow-Origin" to "*")

    data class Rendered(val bytes: ByteArray, val mimeType: String)

    fun process(imageFile: File, uri: Uri, cache: ResizeCache? = null): WebResourceResponse {
        val w = uri.getQueryParameter("w")?.toIntOrNull()
        val h = uri.getQueryParameter("h")?.toIntOrNull()
        val f = (uri.getQueryParameter("f") ?: uri.getQueryParameter("format"))?.lowercase()
        val infos = uri.getQueryParameter("i") ?: uri.getQueryParameter("infos")

        if (infos == "json") {
            val store = cache.takeIf { isCacheEnabled(uri) }
            val key = cacheKey(uri)
            store?.read(key)?.let {
                return WebResourceResponse(it.mimeType, "utf-8", 200, "OK", CORS_HEADERS, it.bytes.inputStream())
            }

            val (srcW, srcH) = readSize(imageFile)
            if (srcW <= 0 || srcH <= 0) return notFoundResponse()
            val json = JSONObject().apply {
                put("width", srcW)
                put("height", srcH)
            }.toString().toByteArray(Charsets.UTF_8)
            store?.write(key, "application/json", json)

            return WebResourceResponse("application/json", "utf-8", 200, "OK", CORS_HEADERS, json.inputStream())
        }

        // Nothing to change: stream the file itself, there is nothing worth caching
        if (w == null && h == null && f == null) {
            return WebResourceResponse(mimeTypeOf(imageFile.extension), null, 200, "OK", CORS_HEADERS, imageFile.inputStream())
        }

        val rendered = render(imageFile, uri, cache) ?: return notFoundResponse()
        return WebResourceResponse(rendered.mimeType, null, 200, "OK", CORS_HEADERS, rendered.bytes.inputStream())
    }

    /**
     * Decode, resize honouring the `m` mode, and re-encode. Shared by the WebView
     * image route and the video export so both crop a frame identically — the
     * renderer owns the framing decision on every platform.
     *
     * Served from [cache] and written back to it when the request opts in with
     * the `c` parameter, like the Electron resizer.
     */
    fun render(imageFile: File, uri: Uri, cache: ResizeCache? = null): Rendered? {
        val w = uri.getQueryParameter("w")?.toIntOrNull()
        val h = uri.getQueryParameter("h")?.toIntOrNull()
        val f = (uri.getQueryParameter("f") ?: uri.getQueryParameter("format"))?.lowercase()
        val m = (uri.getQueryParameter("m") ?: uri.getQueryParameter("mode") ?: "cover").lowercase()
        val q = uri.getQueryParameter("q")?.toIntOrNull()?.coerceIn(0, 100) ?: 85

        val store = cache.takeIf { isCacheEnabled(uri) }
        val key = cacheKey(uri)
        store?.read(key)?.let { return Rendered(it.bytes, it.mimeType) }

        val (srcW, srcH) = readSize(imageFile)
        if (srcW <= 0 || srcH <= 0) return null

        val srcRatio = srcW.toFloat() / srcH
        val dstW = when {
            w != null -> w
            h != null -> (h * srcRatio).toInt().coerceAtLeast(1)
            else -> srcW
        }
        val dstH = when {
            h != null -> h
            w != null -> (w / srcRatio).toInt().coerceAtLeast(1)
            else -> srcH
        }

        // Pre-scale at decode time (power-of-2, free) so the loaded bitmap is just slightly
        // larger than the target — the final bilinear step then works over a small ratio.
        val sampleSize = calculateInSampleSize(srcW, srcH, dstW, dstH)
        val src = BitmapFactory.decodeFile(
            imageFile.absolutePath,
            BitmapFactory.Options().apply { inSampleSize = sampleSize },
        ) ?: return null

        val isOpaque = f == "jpg" || f == "jpeg"
        // Always 8 bits per channel: RGB_565 crushed opaque frames to 5/6/5 and
        // banded every gradient, and the video export now encodes these bytes.
        val dst = Bitmap.createBitmap(dstW, dstH, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(dst)

        if (isOpaque) canvas.drawColor(Color.BLACK)

        val (drawW, drawH) = computeDrawSize(src.width.toFloat(), src.height.toFloat(), dstW.toFloat(), dstH.toFloat(), m)
        val drawX = (dstW - drawW) / 2f
        val drawY = (dstH - drawH) / 2f

        canvas.drawBitmap(src, null, RectF(drawX, drawY, drawX + drawW, drawY + drawH), Paint(Paint.FILTER_BITMAP_FLAG or Paint.DITHER_FLAG))
        src.recycle()

        val compressFormat = when (f) {
            "jpg", "jpeg" -> Bitmap.CompressFormat.JPEG
            "webp" -> Bitmap.CompressFormat.WEBP
            else -> Bitmap.CompressFormat.PNG
        }
        val mimeType = when (f) {
            "jpg", "jpeg" -> "image/jpeg"
            "webp" -> "image/webp"
            else -> "image/png"
        }

        val out = ByteArrayOutputStream()
        dst.compress(compressFormat, q, out)
        dst.recycle()

        val bytes = out.toByteArray()
        store?.write(key, mimeType, bytes)

        return Rendered(bytes, mimeType)
    }

    // Same opt-in as the renderer's parseResizeArguments: only an explicit
    // `c=1`/`c=true` caches, so the export (which sends c=false) never fills the
    // cache with frames nothing will ask for again.
    private fun isCacheEnabled(uri: Uri): Boolean {
        val c = (uri.getQueryParameter("c") ?: uri.getQueryParameter("cache"))?.lowercase()
        return c == "1" || c == "true"
    }

    // Keyed on the path relative to the projects directory, like Electron, so the
    // entries survive the external storage directory moving.
    private fun cacheKey(uri: Uri): String = ResizeCache.key(
        path = uri.pathSegments.drop(2).joinToString("/"),
        w = uri.getQueryParameter("w")?.toIntOrNull(),
        h = uri.getQueryParameter("h")?.toIntOrNull(),
        m = (uri.getQueryParameter("m") ?: uri.getQueryParameter("mode"))?.lowercase(),
        q = uri.getQueryParameter("q")?.toIntOrNull()?.coerceIn(0, 100),
        i = (uri.getQueryParameter("i") ?: uri.getQueryParameter("infos"))?.takeIf { it == "json" },
        f = (uri.getQueryParameter("f") ?: uri.getQueryParameter("format"))?.lowercase(),
    )

    private fun readSize(imageFile: File): Pair<Int, Int> {
        val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(imageFile.absolutePath, opts)
        return Pair(opts.outWidth, opts.outHeight)
    }

    private fun calculateInSampleSize(srcW: Int, srcH: Int, dstW: Int, dstH: Int): Int {
        var sampleSize = 1
        // Keep halving until the next halve would go below the target size
        while (srcW / (sampleSize * 2) >= dstW && srcH / (sampleSize * 2) >= dstH) {
            sampleSize *= 2
        }
        return sampleSize
    }

    private fun computeDrawSize(srcW: Float, srcH: Float, dstW: Float, dstH: Float, mode: String): Pair<Float, Float> {
        val srcRatio = srcW / srcH
        val dstRatio = dstW / dstH
        return if (mode == "contain") {
            if (srcRatio > dstRatio) Pair(dstW, dstW / srcRatio)
            else Pair(dstH * srcRatio, dstH)
        } else { // cover
            if (srcRatio > dstRatio) Pair(dstH * srcRatio, dstH)
            else Pair(dstW, dstW / srcRatio)
        }
    }

    private fun mimeTypeOf(ext: String) = when (ext.lowercase()) {
        "jpg", "jpeg" -> "image/jpeg"
        "png" -> "image/png"
        "webp" -> "image/webp"
        else -> "image/jpeg"
    }

    private fun notFoundResponse() = WebResourceResponse(
        "application/json", "utf-8", 404, "Not Found", emptyMap(), "{}".byteInputStream()
    )
}
