package com.brickabrack.eagleanimation.export

import android.content.ContentValues
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.media.Image
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaCodecInfo.CodecCapabilities
import android.media.MediaCodecInfo.VideoCapabilities
import android.media.MediaCodecList
import android.media.MediaFormat
import android.media.MediaMuxer
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import org.json.JSONObject
import java.io.File
import java.nio.ByteBuffer

data class FrameEntry(
    val link: String,
    val index: Int,
    val extension: String,
    val length: Int,
    val bufferId: String? = null,
    // FRAME, or one of the MASKING_* layers a frames export can include
    val type: String = "FRAME",
)

/**
 * Video codecs the exporter can produce, keyed by the identifier the renderer sends.
 *
 * Both get the same budget on purpose. HEVC needs ~40% fewer bits than AVC on
 * ordinary footage, but that gain comes from inter-frame prediction: here every
 * frame is a full scene change, so the coding is essentially intra, where the two
 * are close — and mid-range hardware HEVC encoders are often the weaker of the
 * two at equal bitrate. Discounting HEVC made it visibly worse, not smaller.
 */
enum class VideoFormat(val key: String, val mime: String, val bitsPerPixel: Double, val minBitrate: Int) {
    H264("h264", MediaFormat.MIMETYPE_VIDEO_AVC, 0.4, 6_000_000),
    HEVC("hevc", MediaFormat.MIMETYPE_VIDEO_HEVC, 0.4, 6_000_000),
}

class VideoExporter(
    private val context: Context,
    private val projectsDir: File,
    private val exportBuffers: ExportBufferStore,
    private val sendEvent: (String, JSONObject) -> Unit,
) {
    companion object {
        private const val TAG = "VideoExporter"
        private const val TIMEOUT_US = 10_000L
        private const val EOS_TIMEOUT_US = 100_000L
        // All-intra: every frame is a key frame. With a GOP, each predicted frame had
        // to encode a complete scene change out of a fraction of the budget, so most
        // frames came out mushy between periodic clean ones. Independent frames spend
        // the bitrate evenly instead — the reason the per-pixel budget above is
        // generous.
        private const val I_FRAME_INTERVAL = 0
        private const val MAX_SIDE = 1920

        // Give up on a frame rather than spinning forever if the encoder never
        // frees an input buffer.
        private const val MAX_INPUT_RETRIES = 500

        fun formatOf(key: String?): VideoFormat =
            VideoFormat.entries.firstOrNull { it.key.equals(key, ignoreCase = true) } ?: VideoFormat.H264

        /** Formats this device can actually encode — a codec may decode HEVC without encoding it. */
        fun supportedFormats(): List<VideoFormat> = VideoFormat.entries.filter { findEncoder(it.mime) != null }

        fun findEncoder(mime: String): MediaCodecInfo? {
            val encoders = MediaCodecList(MediaCodecList.REGULAR_CODECS).codecInfos
                .filter { info -> info.isEncoder && info.supportedTypes.any { it.equals(mime, ignoreCase = true) } }
            // Prefer a hardware encoder, but keep a software one as a fallback
            return encoders.firstOrNull { it.isHardwareAcceleratedCompat() } ?: encoders.firstOrNull()
        }

        private fun MediaCodecInfo.isHardwareAcceleratedCompat(): Boolean =
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) isHardwareAccelerated
            else !name.startsWith("OMX.google.", ignoreCase = true) && !name.startsWith("c2.android.", ignoreCase = true)
    }

    fun export(
        frames: List<FrameEntry>,
        fps: Int,
        outputFps: Int,
        targetWidth: Int?,
        targetHeight: Int?,
        format: VideoFormat = VideoFormat.H264,
    ): String {
        require(frames.isNotEmpty()) { "No frames to export" }
        require(fps > 0 && outputFps >= fps) { "Invalid framerates: $fps -> $outputFps" }

        val firstFile = frameFile(frames[0])
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(firstFile.absolutePath, bounds)
        val (requestedWidth, requestedHeight) = computeSize(bounds.outWidth, bounds.outHeight, targetWidth, targetHeight)

        val encoder = findEncoder(format.mime) ?: error("No ${format.key} encoder available on this device")
        val capabilities = encoder.getCapabilitiesForType(format.mime)
        val videoCapabilities = capabilities.videoCapabilities
        val (width, height) = fitToEncoder(videoCapabilities, requestedWidth, requestedHeight)
        val bitrate = computeBitrate(videoCapabilities, width, height, outputFps, format)
        val colorFormat = selectColorFormat(capabilities)
        Log.d(
            TAG,
            "export: ${frames.size} frames @ ${fps}fps -> ${width}x${height} @ ${outputFps}fps, ${bitrate / 1_000_000}Mbps ${format.key}" +
                " (requested ${requestedWidth}x${requestedHeight}, encoder=${encoder.name}, color=$colorFormat)"
        )

        val mediaFormat = MediaFormat.createVideoFormat(format.mime, width, height).apply {
            setInteger(MediaFormat.KEY_COLOR_FORMAT, colorFormat)
            setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
            setInteger(MediaFormat.KEY_FRAME_RATE, outputFps)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, I_FRAME_INTERVAL)
            // Rate control was left implicit until now. Ask for VBR so a busy frame
            // may borrow bits instead of being held to a constant rate — but only
            // where the encoder advertises it, as configure() rejects a mode it
            // does not support.
            if (supportsVbr(capabilities)) {
                setInteger(MediaFormat.KEY_BITRATE_MODE, MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_VBR)
            }
        }

        val codec = MediaCodec.createByCodecName(encoder.name)
        codec.configure(mediaFormat, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        codec.start()

        // The encoder reads its input plane in aligned blocks: a row is `stride`
        // bytes wide and the chroma plane starts at `stride * sliceHeight`, not at
        // `width * height`. Writing a tightly packed buffer only lined up when the
        // size happened to be aligned, which is why full-resolution exports came
        // out skewed and glitched.
        val inputFormat = codec.inputFormat
        val stride = inputFormat.optInteger(MediaFormat.KEY_STRIDE, width)
        val sliceHeight = inputFormat.optInteger(MediaFormat.KEY_SLICE_HEIGHT, height)
        val frameSize = stride * sliceHeight * 3 / 2

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
        val frameDurationUs = 1_000_000L / outputFps

        // MediaCodec encodes the timestamps it is given, it never resamples. A source
        // frame lasts 1/fps, so at a higher output rate it spans several samples and
        // has to be repeated — otherwise the animation would simply play faster.
        fun sampleAt(frameIndex: Int): Int = Math.round(frameIndex.toDouble() * outputFps / fps).toInt()
        val totalSamples = sampleAt(frames.size)

        fun drain(endOfStream: Boolean = false) {
            var retries = 0
            while (true) {
                val idx = codec.dequeueOutputBuffer(info, if (endOfStream) EOS_TIMEOUT_US else TIMEOUT_US)
                when {
                    idx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        trackIndex = muxer.addTrack(codec.outputFormat)
                        muxer.start()
                        muxerStarted = true
                    }
                    idx >= 0 -> {
                        val buf = codec.getOutputBuffer(idx)!!
                        val isConfig = info.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG != 0
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

        // Reused across frames: at full resolution this array is tens of megabytes
        val pixels = IntArray(width * height)

        // Queues one sample out of the pixels already unpacked above, waiting for a
        // free input buffer instead of skipping it: at high resolution the encoder is
        // slower than the decode loop, and silently dropped frames shortened and
        // stuttered the video.
        fun queueSample(sampleIndex: Int, label: String) {
            var attempts = 0
            while (true) {
                val inputIdx = codec.dequeueInputBuffer(TIMEOUT_US)
                if (inputIdx >= 0) {
                    val image = codec.getInputImage(inputIdx)
                    if (image != null) {
                        fillImage(image, width, height, pixels)
                    } else {
                        fillBuffer(codec.getInputBuffer(inputIdx)!!, width, height, stride, sliceHeight, colorFormat, pixels)
                    }
                    codec.queueInputBuffer(inputIdx, 0, frameSize, sampleIndex * frameDurationUs, 0)
                    return
                }
                if (attempts++ > MAX_INPUT_RETRIES) {
                    Log.w(TAG, "No input buffer for $label, dropping it")
                    return
                }
                drain()
            }
        }

        try {
            for ((i, frame) in frames.withIndex()) {
                val bitmap = loadFrame(frameFile(frame), width, height)
                // Unpacked once per source frame, then reused for each of its samples
                bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
                bitmap.recycle()

                for (sample in sampleAt(i) until sampleAt(i + 1)) {
                    queueSample(sample, "frame $i (sample $sample)")
                    drain()
                }

                sendEvent("FFMPEG_PROGRESS", JSONObject().put("progress", (i + 1).toDouble() / frames.size))
            }

            // Signal end of stream
            val eosIdx = codec.dequeueInputBuffer(TIMEOUT_US)
            if (eosIdx >= 0) {
                codec.queueInputBuffer(eosIdx, 0, 0, totalSamples * frameDurationUs, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
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

        Log.d(TAG, "export done -> $videoUri")
        return videoUri.toString()
    }

    // Each plane announces its own row and pixel stride, which covers both NV12
    // (interleaved chroma, pixelStride 2) and I420 through a single path.
    private fun fillImage(image: Image, w: Int, h: Int, pixels: IntArray) {
        val yPlane = image.planes[0]
        val yBuffer = yPlane.buffer
        for (row in 0 until h) {
            var pos = row * yPlane.rowStride
            val offset = row * w
            for (col in 0 until w) {
                yBuffer.put(pos, yOf(pixels[offset + col]))
                pos += yPlane.pixelStride
            }
        }

        val uPlane = image.planes[1]
        val vPlane = image.planes[2]
        val uBuffer = uPlane.buffer
        val vBuffer = vPlane.buffer
        for (row in 0 until h / 2) {
            var uPos = row * uPlane.rowStride
            var vPos = row * vPlane.rowStride
            val offset = (row * 2) * w
            for (col in 0 until w / 2) {
                val p = pixels[offset + col * 2]
                uBuffer.put(uPos, uOf(p))
                vBuffer.put(vPos, vOf(p))
                uPos += uPlane.pixelStride
                vPos += vPlane.pixelStride
            }
        }
    }

    // Fallback for encoders that expose no Image view: write the planes by hand,
    // still honouring the stride and slice height.
    private fun fillBuffer(buf: ByteBuffer, w: Int, h: Int, stride: Int, sliceHeight: Int, colorFormat: Int, pixels: IntArray) {
        buf.clear()

        for (row in 0 until h) {
            var pos = row * stride
            val offset = row * w
            for (col in 0 until w) {
                buf.put(pos, yOf(pixels[offset + col]))
                pos++
            }
        }

        val chromaBase = stride * sliceHeight
        if (colorFormat == CodecCapabilities.COLOR_FormatYUV420Planar) {
            val chromaStride = stride / 2
            val vBase = chromaBase + chromaStride * (sliceHeight / 2)
            for (row in 0 until h / 2) {
                var uPos = chromaBase + row * chromaStride
                var vPos = vBase + row * chromaStride
                val offset = (row * 2) * w
                for (col in 0 until w / 2) {
                    val p = pixels[offset + col * 2]
                    buf.put(uPos++, uOf(p))
                    buf.put(vPos++, vOf(p))
                }
            }
        } else {
            for (row in 0 until h / 2) {
                var pos = chromaBase + row * stride
                val offset = (row * 2) * w
                for (col in 0 until w / 2) {
                    val p = pixels[offset + col * 2]
                    buf.put(pos++, uOf(p))
                    buf.put(pos++, vOf(p))
                }
            }
        }
    }

    private fun yOf(p: Int): Byte {
        val r = (p shr 16) and 0xFF
        val g = (p shr 8) and 0xFF
        val b = p and 0xFF
        return ((((66 * r + 129 * g + 25 * b + 128) shr 8) + 16)).toByte()
    }

    private fun uOf(p: Int): Byte {
        val r = (p shr 16) and 0xFF
        val g = (p shr 8) and 0xFF
        val b = p and 0xFF
        return ((((-38 * r - 74 * g + 112 * b + 128) shr 8) + 128)).toByte()
    }

    private fun vOf(p: Int): Byte {
        val r = (p shr 16) and 0xFF
        val g = (p shr 8) and 0xFF
        val b = p and 0xFF
        return ((((112 * r - 94 * g - 18 * b + 128) shr 8) + 128)).toByte()
    }

    private fun supportsVbr(capabilities: CodecCapabilities): Boolean = runCatching {
        capabilities.encoderCapabilities.isBitrateModeSupported(MediaCodecInfo.EncoderCapabilities.BITRATE_MODE_VBR)
    }.getOrDefault(false)

    private fun selectColorFormat(capabilities: CodecCapabilities): Int {
        val supported = capabilities.colorFormats.toSet()
        // Flexible first: it is the one format whose plane layout we can read back
        // from the codec instead of guessing it
        return listOf(
            CodecCapabilities.COLOR_FormatYUV420Flexible,
            CodecCapabilities.COLOR_FormatYUV420SemiPlanar,
            CodecCapabilities.COLOR_FormatYUV420Planar,
        ).firstOrNull { it in supported } ?: CodecCapabilities.COLOR_FormatYUV420SemiPlanar
    }

    // The requested size is only a wish: an encoder has a maximum frame size and
    // its own width/height alignment, and feeding it anything else yields a
    // corrupted stream rather than an error.
    private fun fitToEncoder(caps: VideoCapabilities, width: Int, height: Int): Pair<Int, Int> {
        val widthAlignment = maxOf(2, caps.widthAlignment)
        val heightAlignment = maxOf(2, caps.heightAlignment)
        var scale = minOf(1.0, caps.supportedWidths.upper.toDouble() / width, caps.supportedHeights.upper.toDouble() / height)

        repeat(8) {
            val w = alignDown((width * scale).toInt(), widthAlignment).coerceIn(caps.supportedWidths.lower, caps.supportedWidths.upper)
            val h = alignDown((height * scale).toInt(), heightAlignment).coerceIn(caps.supportedHeights.lower, caps.supportedHeights.upper)
            if (runCatching { caps.isSizeSupported(w, h) }.getOrDefault(true)) {
                if (w != width || h != height) {
                    Log.w(TAG, "Encoder cannot handle ${width}x${height}, falling back to ${w}x${h}")
                }
                return Pair(w, h)
            }
            scale *= 0.75
        }

        return Pair(alignDown(MAX_SIDE, widthAlignment), alignDown(MAX_SIDE * height / width, heightAlignment))
    }

    private fun computeBitrate(caps: VideoCapabilities, width: Int, height: Int, fps: Int, format: VideoFormat): Int {
        val target = (width.toLong() * height * fps * format.bitsPerPixel)
            .toLong()
            .coerceIn(format.minBitrate.toLong(), Int.MAX_VALUE.toLong())
            .toInt()
        return runCatching { caps.bitrateRange.clamp(target) }.getOrDefault(target)
    }

    private fun alignDown(value: Int, alignment: Int): Int = value - (value % alignment)

    private fun MediaFormat.optInteger(key: String, fallback: Int): Int =
        if (containsKey(key)) runCatching { getInteger(key) }.getOrNull()?.takeIf { it > 0 } ?: fallback else fallback

    // The renderer asks the backend to render each export frame (EXPORT_BUFFER_FROM_URL)
    // so the framing is decided in one place for every platform. Falling back to the
    // original picture keeps older renderers working.
    private fun frameFile(frame: FrameEntry): File = exportBuffers.get(frame.bufferId) ?: resolveFile(frame.link)

    private fun loadFrame(file: File, w: Int, h: Int): Bitmap {
        val b = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.absolutePath, b)
        var s = 1
        while (b.outWidth / (s * 2) >= w && b.outHeight / (s * 2) >= h) s *= 2
        val raw = BitmapFactory.decodeFile(file.absolutePath, BitmapFactory.Options().apply { inSampleSize = s })!!
        if (raw.width == w && raw.height == h) return raw

        // Cover, never stretch: scale until both sides are filled and centre the
        // overflow. createScaledBitmap deformed any frame whose ratio did not match
        // the requested one, where Electron and the web crop it.
        val dst = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(dst)
        canvas.drawColor(Color.BLACK)
        val scale = maxOf(w.toFloat() / raw.width, h.toFloat() / raw.height)
        val drawW = raw.width * scale
        val drawH = raw.height * scale
        val left = (w - drawW) / 2f
        val top = (h - drawH) / 2f
        canvas.drawBitmap(raw, null, RectF(left, top, left + drawW, top + drawH), Paint(Paint.FILTER_BITMAP_FLAG or Paint.DITHER_FLAG))
        raw.recycle()
        return dst
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
