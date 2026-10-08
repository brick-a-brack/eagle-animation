package com.brickabrack.eagleanimation.storage

import org.json.JSONObject
import java.io.File
import java.nio.file.Files
import java.nio.file.StandardCopyOption

class SettingsStorage(projectsDir: File) {

    private val settingsFile = projectsDir.resolve(".settings").also { it.mkdirs() }.resolve("settings.json")
    private val temporaryFile = File(settingsFile.parentFile, "settings.json.tmp")

    @Synchronized
    fun getSettings(): JSONObject {
        return try {
            if (settingsFile.exists()) JSONObject(settingsFile.readText()) else JSONObject()
        } catch (_: Exception) {
            JSONObject()
        }
    }

    /**
     * Written through a temporary file, then moved into place atomically: writeText
     * truncates first, so an interrupted write — the process is killed on exit —
     * leaves a file that no longer parses. [getSettings] then falls back to an empty
     * object, and the renderer saves its defaults over every existing setting.
     */
    @Synchronized
    fun saveSettings(settings: JSONObject): JSONObject {
        temporaryFile.writeText(settings.toString())
        Files.move(temporaryFile.toPath(), settingsFile.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE)
        return settings
    }
}
