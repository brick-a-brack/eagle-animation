package com.brickabrack.eagleanimation.storage

import org.json.JSONObject
import java.io.File

class SettingsStorage(projectsDir: File) {

    private val settingsFile = projectsDir.resolve(".settings").also { it.mkdirs() }.resolve("settings.json")

    fun getSettings(): JSONObject {
        return try {
            if (settingsFile.exists()) JSONObject(settingsFile.readText()) else JSONObject()
        } catch (_: Exception) {
            JSONObject()
        }
    }

    fun saveSettings(settings: JSONObject): JSONObject {
        settingsFile.writeText(settings.toString())
        return settings
    }
}
