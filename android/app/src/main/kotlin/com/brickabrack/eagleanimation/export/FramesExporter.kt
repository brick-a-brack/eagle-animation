package com.brickabrack.eagleanimation.export

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import androidx.annotation.RequiresApi
import java.io.File
import java.io.OutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

data class FramesExportResult(val uri: String, val mimeType: String, val count: Int)

/**
 * Writes the frames of an export where the user can reach them: one picture per
 * frame in the gallery, or a single archive in Downloads when the renderer asked
 * for a zip.
 *
 * Both paths go through MediaStore, which is the only way to reach shared storage
 * without the legacy storage permission — and the reason the whole feature needs
 * Android 10.
 */
@RequiresApi(Build.VERSION_CODES.Q)
class FramesExporter(
    private val context: Context,
    private val exportBuffers: ExportBufferStore,
) {
    companion object {
        private const val TAG = "FramesExporter"
        private const val ALBUM = "EagleAnimation"

        // Same suffixes as Electron and the web, so an export is named identically
        // whatever the platform.
        private val TYPE_SUFFIXES = mapOf(
            "MASKING_BACKGROUND" to "-background",
            "MASKING_FOREGROUND" to "-foreground",
            "MASKING_TRANSPARENT" to "-transparent",
        )

        private val MIME_TYPES = mapOf(
            "jpg" to "image/jpeg",
            "jpeg" to "image/jpeg",
            "png" to "image/png",
            "webp" to "image/webp",
        )
    }

    fun export(frames: List<FrameEntry>, scenePrefix: String, asZip: Boolean): FramesExportResult {
        require(frames.isNotEmpty()) { "No frames to export" }
        Log.d(TAG, "export: ${frames.size} frame(s), zip=$asZip, prefix=$scenePrefix")
        return if (asZip) exportZip(frames, scenePrefix) else exportPictures(frames, scenePrefix)
    }

    // One subfolder per export: a scene exported twice would otherwise mix both
    // runs under the same names.
    private fun exportPictures(frames: List<FrameEntry>, scenePrefix: String): FramesExportResult {
        val relativePath = "${Environment.DIRECTORY_PICTURES}/$ALBUM/${ALBUM}_${System.currentTimeMillis()}"
        var firstUri: String? = null
        var firstMimeType = "image/jpeg"

        for (frame in frames) {
            val source = bufferOf(frame)
            val mimeType = mimeTypeOf(frame.extension)
            val cv = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, fileNameOf(frame, scenePrefix))
                put(MediaStore.Images.Media.MIME_TYPE, mimeType)
                put(MediaStore.Images.Media.RELATIVE_PATH, relativePath)
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
            val uri = context.contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv)
                ?: error("Could not create ${fileNameOf(frame, scenePrefix)} in $relativePath")
            writeOrDiscard(uri, cv) { out -> source.inputStream().use { it.copyTo(out) } }

            if (firstUri == null) {
                firstUri = uri.toString()
                firstMimeType = mimeType
            }
        }

        Log.d(TAG, "export done -> $relativePath (${frames.size} picture(s))")
        return FramesExportResult(firstUri!!, firstMimeType, frames.size)
    }

    private fun exportZip(frames: List<FrameEntry>, scenePrefix: String): FramesExportResult {
        val cv = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, "${ALBUM}_${System.currentTimeMillis()}.zip")
            put(MediaStore.Downloads.MIME_TYPE, "application/zip")
            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv)
            ?: error("Could not create the archive in ${Environment.DIRECTORY_DOWNLOADS}")

        writeOrDiscard(uri, cv) { out ->
            ZipOutputStream(out).use { zip ->
                for (frame in frames) {
                    val source = bufferOf(frame)
                    zip.putNextEntry(ZipEntry(fileNameOf(frame, scenePrefix)))
                    source.inputStream().use { it.copyTo(zip) }
                    zip.closeEntry()
                }
            }
        }

        Log.d(TAG, "export done -> $uri (${frames.size} frame(s) zipped)")
        return FramesExportResult(uri.toString(), "application/zip", frames.size)
    }

    // A pending entry that was never written stays invisible but keeps its name:
    // drop it on failure rather than publishing a truncated file.
    private fun writeOrDiscard(uri: Uri, cv: ContentValues, write: (OutputStream) -> Unit) {
        try {
            val out = context.contentResolver.openOutputStream(uri) ?: error("Could not open $uri for writing")
            out.use(write)
        } catch (e: Throwable) {
            runCatching { context.contentResolver.delete(uri, null, null) }
            throw e
        }
        cv.clear()
        cv.put(MediaStore.MediaColumns.IS_PENDING, 0)
        context.contentResolver.update(uri, cv, null, null)
    }

    // The renderer rendered every frame through EXPORT_BUFFER_FROM_URL beforehand, so
    // a missing buffer means the export is incomplete — say so instead of writing a
    // set of frames with holes in it.
    private fun bufferOf(frame: FrameEntry): File =
        exportBuffers.get(frame.bufferId) ?: error("Missing export buffer for frame ${frame.index}")

    private fun fileNameOf(frame: FrameEntry, scenePrefix: String): String {
        val index = frame.index.toString().padStart(6, '0')
        val suffix = TYPE_SUFFIXES[frame.type] ?: ""
        return "${scenePrefix}_$index$suffix.${frame.extension}"
    }

    private fun mimeTypeOf(extension: String): String {
        val ext = extension.lowercase()
        return MIME_TYPES[ext] ?: "image/$ext"
    }
}
