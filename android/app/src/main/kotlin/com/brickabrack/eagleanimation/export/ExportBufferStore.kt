package com.brickabrack.eagleanimation.export

import android.util.Log
import java.io.File

/**
 * Frames rendered by the backend for an export, keyed by the buffer id the
 * renderer generated. Mirrors the temporary buffers Electron writes next to the
 * project: the renderer decides the framing and hands over an id, never bytes.
 */
class ExportBufferStore(private val dir: File) {

    fun put(bufferId: String, bytes: ByteArray): File {
        if (!dir.exists()) dir.mkdirs()
        val file = File(dir, sanitize(bufferId))
        file.writeBytes(bytes)
        return file
    }

    fun get(bufferId: String?): File? {
        if (bufferId.isNullOrBlank()) return null
        return File(dir, sanitize(bufferId)).takeIf { it.exists() && it.length() > 0 }
    }

    fun clear() {
        val removed = dir.listFiles()?.count { it.delete() } ?: 0
        if (removed > 0) Log.d("ExportBufferStore", "cleared $removed buffer(s)")
    }

    // Buffer ids are UUIDs, but they arrive from the renderer: keep them from
    // escaping the directory.
    private fun sanitize(bufferId: String) = bufferId.replace(Regex("[^A-Za-z0-9_-]"), "")
}
