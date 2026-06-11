package com.brickabrack.eagleanimation.storage

import android.graphics.Bitmap
import android.util.Base64
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

class ProjectStorage(val projectsDir: File) {

    companion object {
        private const val PROJECT_FILE = "project.eagleanimation"
        private const val DEFAULT_FPS = 12
        private const val VERSION = "2.16.0"
    }

    private fun time() = System.currentTimeMillis() / 1000L

    fun getAllProjects(): List<Pair<String, JSONObject>> {
        return projectsDir.listFiles { f -> f.isDirectory && !f.name.startsWith(".") }
            ?.mapNotNull { dir ->
                readProjectFile(dir.name)?.let { json ->
                    if (!json.optBoolean("deleted", false)) Pair(dir.name, json) else null
                }
            } ?: emptyList()
    }

    fun getProject(id: String): Pair<String, JSONObject>? {
        return readProjectFile(id)?.let { Pair(id, it) }
    }

    fun createProject(title: String): String {
        val id = UUID.randomUUID().toString()
        val dir = projectsDir.resolve(id)
        dir.mkdirs()
        val t = time()
        val project = JSONObject().apply {
            put("title", title)
            put("version", VERSION)
            put("creation", t)
            put("updated", t)
            put("deleted", false)
            put("scenes", JSONArray().apply {
                put(JSONObject().apply {
                    put("id", UUID.randomUUID().toString())
                    put("title", "")
                    put("framerate", DEFAULT_FPS)
                    put("pictures", JSONArray())
                    put("deleted", false)
                })
            })
        }
        dir.resolve(PROJECT_FILE).writeText(project.toString())
        return id
    }

    fun saveProject(id: String, projectData: JSONObject): Boolean {
        val file = projectsDir.resolve(id).resolve(PROJECT_FILE)
        if (!file.parentFile!!.exists()) return false
        projectData.put("updated", time())
        file.writeText(projectData.toString())
        return true
    }

    fun deleteProject(id: String): Boolean {
        val file = projectsDir.resolve(id).resolve(PROJECT_FILE)
        if (!file.exists()) return false
        val json = JSONObject(file.readText())
        json.put("deleted", true)
        file.writeText(json.toString())
        return true
    }

    fun savePictureBytes(projectId: String, sceneIndex: Int, extension: String, bytes: ByteArray): String? {
        Log.d("ProjectStorage", "savePictureBytes: project=$projectId scene=$sceneIndex ext=$extension size=${bytes.size}")
        return try {
            val sceneDir = projectsDir.resolve(projectId).resolve(sceneIndex.toString())
            sceneDir.mkdirs()
            val filename = "${UUID.randomUUID()}.$extension"
            sceneDir.resolve(filename).writeBytes(bytes)
            filename
        } catch (e: Exception) {
            Log.e("ProjectStorage", "savePictureBytes failed", e)
            null
        }
    }

    fun savePictureBitmap(projectId: String, sceneIndex: Int, extension: String, bitmap: Bitmap): String? {
        return try {
            val sceneDir = projectsDir.resolve(projectId).resolve(sceneIndex.toString())
            sceneDir.mkdirs()
            val filename = "${UUID.randomUUID()}.$extension"
            val format = if (extension == "png") Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG
            sceneDir.resolve(filename).outputStream().use { bitmap.compress(format, 90, it) }
            filename
        } catch (e: Exception) {
            Log.e("ProjectStorage", "savePictureBitmap failed", e)
            null
        }
    }

    fun savePicture(projectId: String, sceneIndex: Int, extension: String, base64Data: String): String? {
        Log.d("ProjectStorage", "savePicture: project=$projectId scene=$sceneIndex ext=$extension b64Len=${base64Data.length}")
        return try {
            val sceneDir = projectsDir.resolve(projectId).resolve(sceneIndex.toString())
            sceneDir.mkdirs()
            val filename = "${UUID.randomUUID()}.$extension"
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            Log.d("ProjectStorage", "savePicture: decoded ${bytes.size} bytes → $filename")
            sceneDir.resolve(filename).writeBytes(bytes)
            filename
        } catch (e: Exception) {
            Log.e("ProjectStorage", "savePicture failed", e)
            null
        }
    }

    private fun readProjectFile(id: String): JSONObject? {
        val file = projectsDir.resolve(id).resolve(PROJECT_FILE)
        return try {
            if (file.exists()) JSONObject(file.readText()) else null
        } catch (_: Exception) {
            null
        }
    }
}
