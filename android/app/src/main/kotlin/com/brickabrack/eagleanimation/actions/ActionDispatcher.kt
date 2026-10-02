package com.brickabrack.eagleanimation.actions

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Log
import com.brickabrack.eagleanimation.export.FrameEntry
import com.brickabrack.eagleanimation.export.VideoExporter
import com.brickabrack.eagleanimation.storage.ProjectStorage
import com.brickabrack.eagleanimation.storage.SettingsStorage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class ActionDispatcher(
    private val context: Context,
    private val projectStorage: ProjectStorage,
    private val settingsStorage: SettingsStorage,
    private val cameraServerToken: String = "",
) {

    @Suppress("ReturnCount")
    suspend fun dispatch(
        action: String,
        data: JSONObject,
        onEvent: (String, JSONObject) -> Unit = { _, _ -> },
    ): Any? {
        return when (action) {
        "GET_LAST_VERSION" -> JSONObject().put("version", JSONObject.NULL)

        "GET_PROJECTS" -> {
            val arr = JSONArray()
            projectStorage.getAllProjects().forEach { (id, proj) -> arr.put(computeProject(id, proj)) }
            arr
        }

        "NEW_PROJECT" -> {
            val title = data.optString("title", "")
            val id = projectStorage.createProject(title)
            projectStorage.getProject(id)?.let { (pid, proj) -> computeProject(pid, proj) }
        }

        "GET_PROJECT" -> {
            val id = data.optString("project_id")
            projectStorage.getProject(id)?.let { (pid, proj) -> computeProject(pid, proj) }
        }

        "SAVE_PROJECT" -> {
            val id = data.optString("project_id")
            val inner = data.optJSONObject("data")?.optJSONObject("project") ?: return@dispatch null
            projectStorage.saveProject(id, inner)
            projectStorage.getProject(id)?.let { (pid, proj) -> computeProject(pid, proj) }
        }

        "DELETE_PROJECT" -> {
            projectStorage.deleteProject(data.optString("project_id"))
            null
        }

        "OPEN_LINK" -> {
            val link = data.optString("link")
            withContext(Dispatchers.Main) {
                runCatching {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(link)).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    })
                }
            }
            null
        }

        "GET_SETTINGS" -> settingsStorage.getSettings()

        "SAVE_SETTINGS" -> {
            val settings = data.optJSONObject("settings") ?: JSONObject()
            settingsStorage.saveSettings(settings)
        }

        "SAVE_PICTURE" -> {
            val projectId = data.optString("project_id")
            val trackId = data.optInt("track_id", 0)
            val extension = data.optString("extension", "jpg").ifBlank { "jpg" }
            val b64 = data.optJSONObject("buffer")?.optString("__b64") ?: ""
            val filename = projectStorage.savePicture(projectId, trackId, extension, b64) ?: return@dispatch null
            JSONObject().apply {
                put("filename", filename)
                put("deleted", false)
                put("length", 1)
                put("link", pictureLink(projectId, trackId, filename))
                put("metaLink", metaLink(projectId, trackId, filename))
            }
        }

        "SAVE_PICTURE_FROM_URLS" -> {
            val projectId = data.optString("project_id")
            val trackId = data.optInt("track_id", 0)
            val extension = data.optString("extension", "jpg").ifBlank { "jpg" }
            val authorization = data.optString("authorization")
            val reverseX = data.optBoolean("reverseX", false)
            val reverseY = data.optBoolean("reverseY", false)
            val urlsJson = data.optJSONArray("urls") ?: return@dispatch null
            val urls = (0 until urlsJson.length()).map { urlsJson.getString(it) }
            Log.d("ActionDispatcher", "SAVE_PICTURE_FROM_URLS: ${urls.size} frame(s) reverseX=$reverseX reverseY=$reverseY")

            val filename = if (urls.size == 1 && !reverseX && !reverseY) {
                // Fast path: single frame, no flip — copy bytes directly without decode/encode
                val bytes = fetchBytes(urls[0], authorization)
                Log.d("ActionDispatcher", "SAVE_PICTURE_FROM_URLS: fast path ${bytes.size} bytes")
                projectStorage.savePictureBytes(projectId, trackId, extension, bytes)
            } else {
                // Bitmap path: multiple frames (averaging) and/or flip
                val bitmaps = urls.map { url ->
                    val bytes = fetchBytes(url, authorization)
                    Log.d("ActionDispatcher", "SAVE_PICTURE_FROM_URLS: fetched ${bytes.size} bytes")
                    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                }
                var result = if (bitmaps.size == 1) bitmaps[0] else averageBitmaps(bitmaps)
                if (reverseX || reverseY) {
                    val matrix = Matrix().apply { preScale(if (reverseX) -1f else 1f, if (reverseY) -1f else 1f) }
                    result = Bitmap.createBitmap(result, 0, 0, result.width, result.height, matrix, false)
                }
                projectStorage.savePictureBitmap(projectId, trackId, extension, result)
            } ?: return@dispatch null

            JSONObject().apply {
                put("filename", filename)
                put("deleted", false)
                put("length", 1)
                put("link", pictureLink(projectId, trackId, filename))
                put("metaLink", metaLink(projectId, trackId, filename))
            }
        }

        // Export actions
        "APP_CAPABILITIES" -> JSONArray().apply {
            put("EXPORT_VIDEO")
            put("EXPORT_VIDEO_H264")
        }

        "EXPORT_SELECT_PATH" -> "android"  // non-null sentinel; actual path determined in EXPORT

        "EXPORT_BUFFER" -> null  // no-op: frames are read directly from disk in EXPORT

        "EXPORT" -> {
            val framesJson = data.optJSONArray("frames") ?: return@dispatch null
            val frames = (0 until framesJson.length()).mapNotNull { i ->
                val f = framesJson.optJSONObject(i) ?: return@mapNotNull null
                val link = f.optString("link").ifBlank { null } ?: return@mapNotNull null
                FrameEntry(
                    link = link,
                    index = f.optInt("index", i),
                    extension = f.optString("extension", "jpg"),
                    length = f.optInt("length", 1),
                )
            }
            if (frames.isEmpty()) return@dispatch null

            val fps = if (data.optBoolean("custom_output_framerate", false))
                data.optInt("custom_output_framerate_number", 10)
            else
                data.optInt("framerate", 12)

            val resolution = data.optJSONObject("export_resolution")
            val targetW = resolution?.takeIf { it.has("width") }?.optInt("width")?.takeIf { it > 0 }
            val targetH = resolution?.takeIf { it.has("height") }?.optInt("height")?.takeIf { it > 0 }

            val exporter = VideoExporter(context, projectStorage.projectsDir, onEvent)
            val uri = withContext(Dispatchers.IO) {
                exporter.export(frames, fps.coerceAtLeast(1), targetW, targetH)
            }
            withContext(Dispatchers.Main) {
                runCatching {
                    context.startActivity(
                        Intent(Intent.ACTION_VIEW).apply {
                            setDataAndType(android.net.Uri.parse(uri), "video/mp4")
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        }
                    )
                }
            }
            JSONObject().put("uri", uri)
        }

        "GET_TOUCAN_CAMERA_SERVER_CONFIG" -> JSONObject()
            .put("port", "8040")
            .put("token", cameraServerToken)

        "SYNC", "GET_SYNC_LIST", "DISCORD_ACTIVITY" -> null

        else -> null
        }
    }

    private fun fetchBytes(url: String, authorization: String): ByteArray {
        val conn = URL(url).openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        if (authorization.isNotEmpty()) conn.setRequestProperty("Authorization", authorization)
        conn.connectTimeout = 30_000
        conn.readTimeout = 30_000
        return conn.inputStream.use { it.readBytes() }
    }

    private fun averageBitmaps(bitmaps: List<Bitmap>): Bitmap {
        val width = bitmaps[0].width
        val height = bitmaps[0].height
        val n = bitmaps.size
        val pixels = IntArray(width * height)
        val rSum = IntArray(pixels.size)
        val gSum = IntArray(pixels.size)
        val bSum = IntArray(pixels.size)
        for (bitmap in bitmaps) {
            bitmap.getPixels(pixels, 0, width, 0, 0, width, height)
            for (i in pixels.indices) {
                rSum[i] += (pixels[i] shr 16) and 0xFF
                gSum[i] += (pixels[i] shr 8) and 0xFF
                bSum[i] += pixels[i] and 0xFF
            }
        }
        for (i in pixels.indices) {
            pixels[i] = (0xFF shl 24) or ((rSum[i] / n) shl 16) or ((gSum[i] / n) shl 8) or (bSum[i] / n)
        }
        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        result.setPixels(pixels, 0, width, 0, 0, width, height)
        return result
    }

    private fun computeProject(projectId: String, projectData: JSONObject): JSONObject {
        val project = JSONObject(projectData.toString())
        val scenes = project.optJSONArray("scenes") ?: JSONArray()

        for (i in 0 until scenes.length()) {
            val scene = scenes.getJSONObject(i)
            if (!scene.has("id")) scene.put("id", UUID.randomUUID().toString())
            if (!scene.has("deleted")) scene.put("deleted", false)

            val pictures = scene.optJSONArray("pictures") ?: JSONArray()
            for (j in 0 until pictures.length()) {
                val pic = pictures.getJSONObject(j)
                val fn = pic.optString("filename", "")
                pic.put("link", pictureLink(projectId, i, fn))
                pic.put("metaLink", metaLink(projectId, i, fn))

                pic.optJSONObject("masking")?.let { masking ->
                    for (key in listOf("background", "foreground", "transparent")) {
                        masking.optJSONObject(key)?.let { item ->
                            val mFn = item.optString("filename", "")
                            item.put("link", pictureLink(projectId, i, mFn))
                            item.put("metaLink", metaLink(projectId, i, mFn))
                        }
                    }
                    pic.put("masking", masking)
                }
                pictures.put(j, pic)
            }
            scene.put("pictures", pictures)
            scenes.put(i, scene)
        }

        project.put("scenes", scenes)
        return JSONObject().apply {
            put("id", projectId)
            put("project", project)
        }
    }

    /** Returns [projectId, sceneIndex, filename] from a picture link. */
    private fun pictureSegments(link: String): List<String> =
        link.substringBefore("?")
            .removePrefix("https://appassets.androidplatform.net/api/pictures/")
            .split("/")

    private fun pictureLink(projectId: String, sceneIndex: Any, filename: String) =
        "https://appassets.androidplatform.net/api/pictures/$projectId/$sceneIndex/$filename"

    private fun metaLink(projectId: String, sceneIndex: Any, filename: String) =
        "https://appassets.androidplatform.net/api/pictures/$projectId/$sceneIndex/$filename?infos=json"
}
