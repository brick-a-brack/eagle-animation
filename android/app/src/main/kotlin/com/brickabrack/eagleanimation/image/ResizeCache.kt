package com.brickabrack.eagleanimation.image

import android.util.Log
import java.io.File
import java.nio.ByteBuffer
import java.security.MessageDigest

/**
 * Disk cache for resized and converted frames, mirroring the Electron resizer
 * cache: the key is a SHA-256 of the picture path plus every resize parameter,
 * and each entry carries its own mime type ahead of the payload.
 *
 * Entries never need invalidating. A picture is named after a UUID and is never
 * rewritten, so a re-shoot lands on a new path and therefore a new key.
 *
 * It lives in the app cache directory, which Android is free to reclaim under
 * storage pressure — losing an entry only costs one resize.
 */
class ResizeCache(private val dir: File) {

    data class Entry(val mimeType: String, val bytes: ByteArray)

    fun read(key: String): Entry? {
        val file = fileOf(key)
        if (!file.exists() || file.length() <= 4) return null
        return try {
            decode(file.readBytes())
        } catch (e: Exception) {
            Log.w(TAG, "unreadable entry $key", e)
            null
        }
    }

    fun write(key: String, mimeType: String, bytes: ByteArray) {
        try {
            val file = fileOf(key)
            file.parentFile?.mkdirs()
            // Write aside then move into place: an interrupted request must not
            // leave a truncated entry behind to be served as a valid one later.
            val tmp = File(file.parentFile, "${file.name}.tmp")
            tmp.writeBytes(encode(mimeType, bytes))
            if (!tmp.renameTo(file)) tmp.delete()
        } catch (e: Exception) {
            Log.w(TAG, "could not write entry $key", e)
        }
    }

    private fun fileOf(key: String) = File(File(dir, key.take(2)), "${key.drop(2)}.bin")

    // 4-byte big-endian mime type length, the mime type, then the image bytes
    private fun encode(mimeType: String, bytes: ByteArray): ByteArray {
        val mime = mimeType.toByteArray(Charsets.UTF_8)
        return ByteBuffer.allocate(4 + mime.size + bytes.size)
            .putInt(mime.size)
            .put(mime)
            .put(bytes)
            .array()
    }

    private fun decode(raw: ByteArray): Entry? {
        if (raw.size < 4) return null
        val buffer = ByteBuffer.wrap(raw)
        val mimeLength = buffer.int
        if (mimeLength <= 0 || mimeLength > raw.size - 4) return null
        val mime = ByteArray(mimeLength).also { buffer.get(it) }
        val payload = ByteArray(buffer.remaining()).also { buffer.get(it) }
        if (payload.isEmpty()) return null
        return Entry(String(mime, Charsets.UTF_8), payload)
    }

    companion object {
        private const val TAG = "ResizeCache"

        fun key(path: String, w: Int?, h: Int?, m: String?, q: Int?, i: String?, f: String?): String {
            val raw = buildString {
                if (path.isNotEmpty()) append("${path}_")
                if (w != null) append("w${w}_")
                if (h != null) append("h${h}_")
                if (m != null) append("m${m}_")
                if (q != null) append("q${q}_")
                if (i != null) append("i${i}_")
                if (f != null) append("f${f}_")
            }
            return MessageDigest.getInstance("SHA-256")
                .digest(raw.toByteArray(Charsets.UTF_8))
                .joinToString("") { "%02x".format(it) }
        }
    }
}
