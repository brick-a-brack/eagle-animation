package com.brickfilms.toucancameraserver

/**
 * Result of a [CameraServerService.start] or [CameraServerService.stop] call.
 *
 * Always invoked exactly once, on the main thread.
 */
fun interface ServerCallback {
    fun onResult(state: ServerState)
}
