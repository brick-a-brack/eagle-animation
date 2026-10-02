package com.brickfilms.toucancameraserver

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

class CameraServerService : Service() {

    companion object {
        private const val CHANNEL_ID = "camera_server"
        private const val NOTIF_ID   = 1

        @Volatile
        var isRunning = false

        init {
            System.loadLibrary("toucan_camera")
        }

        @JvmStatic
        external fun startServer()

        @JvmStatic
        external fun stopServer()

        @JvmStatic
        external fun setToken(token: String)
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA)
        } else {
            startForeground(NOTIF_ID, notification)
        }
        isRunning = true
        startServer()
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        stopServer()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Camera Server",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Remote HTTP camera controller"
        }
        val mgr = getSystemService(NotificationManager::class.java)
        mgr.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification =
        Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Toucan Camera Server")
            .setContentText("API running on port 8040")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .build()
}
