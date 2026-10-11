package com.brickfilms.toucancameraserver

import org.json.JSONObject

/**
 * Lifecycle of the native server as the app needs to see it.
 *
 * The native library only knows two states (bound or not); `Starting` and
 * `Failed` are tracked here because binding is asynchronous from the caller's
 * point of view and a failure has to stay readable.
 */
enum class ServerPhase { Stopped, Starting, Running, Failed }

/**
 * Snapshot of the native HTTP server. Mirrors the JSON returned by
 * `serverStatusJson()` — see the `Status` struct in the server's `src/lib.rs`.
 *
 * Every field comes from the native side, so nothing here is a guess: [port] is
 * the port actually bound (it differs from the requested one when that was
 * taken), and [token] is the one the auth middleware currently accepts.
 */
data class ServerState(
    val phase: ServerPhase = ServerPhase.Stopped,
    /** The port in use, or 0 when stopped. */
    val port: Int = 0,
    /** What the socket is bound to: `0.0.0.0` when exposed, else `127.0.0.1`. */
    val bindAddress: String = "",
    /** Whether other devices on the network can reach the server. */
    val expose: Boolean = false,
    val token: String = "",
    val version: String = "",
    /** Identifies this server run; also returned by `GET /health`. */
    val instanceId: String = "",
    val uptimeSeconds: Long = 0,
    /** Registered backends, e.g. `["camera2-android", "remote"]`. */
    val backends: List<String> = emptyList(),
    val error: String? = null,
) {
    val isRunning: Boolean get() = phase == ServerPhase.Running

    companion object {
        /**
         * Parses `serverStatusJson()`. On malformed JSON — which would mean a
         * broken native lib — keeps [previous] and records why, rather than
         * throwing inside a state update.
         */
        fun fromJson(json: String, previous: ServerState = ServerState()): ServerState = try {
            val o = JSONObject(json)
            val running = o.optBoolean("running", false)
            ServerState(
                phase = if (running) ServerPhase.Running else ServerPhase.Stopped,
                port = o.optInt("port", 0),
                bindAddress = o.optString("bind_address", ""),
                expose = o.optBoolean("expose", false),
                token = o.optString("token", ""),
                version = o.optString("version", ""),
                instanceId = o.optString("instance_id", ""),
                uptimeSeconds = o.optLong("uptime_seconds", 0),
                backends = o.optJSONArray("backends").let { array ->
                    if (array == null) emptyList()
                    else (0 until array.length()).mapNotNull { array.optString(it, null) }
                },
                error = if (o.isNull("last_error")) null else o.optString("last_error").ifEmpty { null },
            )
        } catch (e: Exception) {
            previous.copy(error = "Unreadable server status: ${e.message}")
        }
    }
}
