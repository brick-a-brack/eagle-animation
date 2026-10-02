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

    fun process(imageFile: File, uri: Uri): WebResourceResponse {
        val w = uri.getQueryParameter("w")?.toIntOrNull()
        val h = uri.getQueryParameter("h")?.toIntOrNull()
        val f = (uri.getQueryParameter("f") ?: uri.getQueryParameter("format"))?.lowercase()
        val m = (uri.getQueryParameter("m") ?: uri.getQueryParameter("mode") ?: "cover").lowercase()
        val q = uri.getQueryParameter("q")?.toIntOrNull()?.coerceIn(0, 100) ?: 85
        val infos = uri.getQueryParameter("i") ?: uri.getQueryParameter("infos")

        val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(imageFile.absolutePath, opts)
        val srcW = opts.outWidth
        val srcH = opts.outHeight

        if (srcW <= 0 || srcH <= 0) return notFoundResponse()

        if (infos == "json") {
            val json = JSONObject().apply {
                put("width", srcW)
                put("height", srcH)
            }.toString()
            return WebResourceResponse("application/json", "utf-8", 200, "OK", CORS_HEADERS, json.byteInputStream())
        }

        if (w == null && h == null && f == null) {
            return WebResourceResponse(mimeTypeOf(imageFile.extension), null, 200, "OK", CORS_HEADERS, imageFile.inputStream())
        }

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
        ) ?: return notFoundResponse()

        val isOpaque = f == "jpg" || f == "jpeg"
        val dst = Bitmap.createBitmap(dstW, dstH, if (isOpaque) Bitmap.Config.RGB_565 else Bitmap.Config.ARGB_8888)
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

        return WebResourceResponse(mimeType, null, 200, "OK", CORS_HEADERS, out.toByteArray().inputStream())
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
