package com.brickabrack.eagleanimation.export

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.nio.ByteBuffer

data class FrameEntry(val link: String, val index: Int, val extension: String, val length: Int)

class VideoExporter(
    private val context: Context,
    private val projectsDir: File,
    private val sendEvent: (String, JSONObject) -> Unit,
) {
    companion object {
        private const val TAG = "VideoExporter"
        private const val TIMEOUT_US = 10_000L
        private const val EOS_TIMEOUT_US = 100_000L
        private const val BITRATE = 8_000_000
        private const val I_FRAME_INTERVAL = 2
        private const val MIME = MediaFormat.MIMETYPE_VIDEO_AVC
        private const val MAX_SIDE = 1920
    }

    fun export(frames: List<FrameEntry>, fps: Int, targetWidth: Int?, targetHeight: Int?): String {
        require(frames.isNotEmpty()) { "No frames to export" }

        val firstFile = resolveFile(frames[0].link)
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(firstFile.absolutePath, bounds)
        val (width, height) = computeSize(bounds.outWidth, bounds.outHeight, targetWidth, targetHeight)
        Log.d(TAG, "export: ${frames.size} frames → ${width}x${height} @ ${fps}fps")

        val mediaFormat = MediaFormat.createVideoFormat(MIME, width, height).apply {
            setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420SemiPlanar)
            setInteger(MediaFormat.KEY_BIT_RATE, BITRATE)
            setInteger(MediaFormat.KEY_FRAME_RATE, fps)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
        }

        val codec = MediaCodec.createEncoderByType(MIME)
        codec.configure(mediaFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        codec.start()

        val ts = System.currentTimeMillis()
        val cv = ContentValues().apply {
            put(MediaStore.Video.Media.DISPLAY_NAME, "EagleAnimation_$ts.mp4")
            put(MediaStore.Video.Media.MIME_TYPE, "video/mp4")
            put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES)
            put(MediaStore.Video.Media.IS_PENDING, 1)
        }
        val videoUri = context.contentResolver.insert(MediaStore.Video.Media.EXTERNAL_CONTENT_URI, cv)!!
        val pfd = context.contentResolver.openFileDescriptor(videoUri, "rw")!!

        val muxer = MediaMuxer(pfd.fileDescriptor, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        var trackIndex = -1
        var muxerStarted = false
        val info = MediaCodec.BufferInfo()
        val frameDurationUs = 1_000_000L / fps

        fun drain(endOfStream: Boolean = false) {
            var retries = 0
            while (true) {
                val idx = codec.dequeueOutputBuffer(info, if (endOfStream) EOS_TIMEOUT_US else TIMEOUT_US)
                when {
                    idx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        Log.d(TAG, "drain: FORMAT_CHANGED → addTrack + start")
                        trackIndex = muxer.addTrack(codec.outputFormat)
                        muxer.start()
                        muxerStarted = true
                    }
                    idx >= 0 -> {
                        val buf = codec.getOutputBuffer(idx)!!
                        val isConfig = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
                        Log.d(TAG, "drain: buf idx=$idx size=${info.size} isConfig=$isConfig muxerStarted=$muxerStarted flags=${info.flags}")
                        if (!isConfig && muxerStarted && info.size > 0) {
                            muxer.writeSampleData(trackIndex, buf, info)
                        }
                        codec.releaseOutputBuffer(idx, false)
                        if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) return
                    }
                    idx == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                        if (!endOfStream) return
                        if (retries++ > 200) { Log.w(TAG, "drain: EOS timeout"); return }
                    }
                }
            }
        }

        try {
            for ((i, frame) in frames.withIndex()) {
                val bitmap = loadAndScale(resolveFile(frame.link), width, height)
                val pts = i * frameDurationUs
                val inputIdx = codec.dequeueInputBuffer(TIMEOUT_US)
                if (inputIdx >= 0) {
                    val buf = codec.getInputBuffer(inputIdx)!!
                    fillNv12(buf, bitmap, width, height)
                    codec.queueInputBuffer(inputIdx, 0, width * height * 3 / 2, pts, 0)
                }
                bitmap.recycle()
                drain()
                sendEvent("FFMPEG_PROGRESS", JSONObject().put("progress", (i + 1).toDouble() / frames.size))
            }

            // Signal end of stream
            val eosIdx = codec.dequeueInputBuffer(TIMEOUT_US)
            if (eosIdx >= 0) {
                codec.queueInputBuffer(eosIdx, 0, 0, frames.size * frameDurationUs, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
            }
            drain(endOfStream = true)
        } finally {
            runCatching { codec.stop() }
            runCatching { codec.release() }
            runCatching { if (muxerStarted) muxer.stop() }
            runCatching { muxer.release() }
            runCatching { pfd.close() }
            cv.clear()
            cv.put(MediaStore.Video.Media.IS_PENDING, 0)
            context.contentResolver.update(videoUri, cv, null, null)
        }

        Log.d(TAG, "export done → $videoUri")
        return videoUri.toString()
    }

    private fun fillNv12(buf: ByteBuffer, bitmap: Bitmap, w: Int, h: Int) {
        val pixels = IntArray(w * h)
        bitmap.getPixels(pixels, 0, w, 0, 0, w, h)
        buf.clear()
        // Y plane
        for (i in pixels.indices) {
            val p = pixels[i]
            val r = (p shr 16) and 0xFF
            val g = (p shr 8) and 0xFF
            val b = p and 0xFF
            buf.put((((66 * r + 129 * g + 25 * b + 128) shr 8) + 16).toByte())
        }
        // UV plane — NV12: interleaved U then V per 2×2 block
        for (row in 0 until h / 2) {
            for (col in 0 until w / 2) {
                val p = pixels[(row * 2) * w + (col * 2)]
                val r = (p shr 16) and 0xFF
                val g = (p shr 8) and 0xFF
                val b = p and 0xFF
                buf.put((((-38 * r - 74 * g + 112 * b + 128) shr 8) + 128).toByte()) // U
                buf.put((((112 * r - 94 * g - 18 * b + 128) shr 8) + 128).toByte())  // V
            }
        }
    }

    private fun loadAndScale(file: File, w: Int, h: Int): Bitmap {
        val b = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, b)
        var s = 1
        while (b.outWidth / (s * 2) >= w && b.outHeight / (s * 2) >= h) s *= 2
        val raw = BitmapFactory.decodeFile(file.absolutePath, BitmapFactory.Options().apply { inSampleSize = s })!!
        return if (raw.width == w && raw.height == h) raw
        else Bitmap.createScaledBitmap(raw, w, h, true).also { if (it !== raw) raw.recycle() }
    }

    private fun computeSize(srcW: Int, srcH: Int, tw: Int?, th: Int?): Pair<Int, Int> {
        val ratio = srcW.toFloat() / srcH
        val w: Int
        val h: Int
        when {
            tw != null && th != null -> { w = tw; h = th }
            tw != null -> { w = tw; h = (tw / ratio).toInt() }
            th != null -> { h = th; w = (th * ratio).toInt() }
            srcW > MAX_SIDE || srcH > MAX_SIDE -> if (srcW >= srcH) {
                w = MAX_SIDE; h = (MAX_SIDE / ratio).toInt()
            } else {
                h = MAX_SIDE; w = (MAX_SIDE * ratio).toInt()
            }
            else -> { w = srcW; h = srcH }
        }
        // H.264 requires even dimensions
        return Pair(w - w % 2, h - h % 2)
    }

    private fun resolveFile(link: String): File {
        val parts = link.substringBefore("?")
            .removePrefix("https://appassets.androidplatform.net/api/pictures/")
            .split("/")
        return projectsDir.resolve(parts[0]).resolve(parts[1]).resolve(parts[2])
    }
}
