package com.pdfdownloadreactnative

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileInputStream
import java.io.IOException

class RNAndroidStore(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "RNAndroidStore"

    @ReactMethod
    fun saveFileToDownloads(filePath: String, mimeType: String, fileName: String, promise: Promise) {
        try {
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                put(MediaStore.Downloads.MIME_TYPE, mimeType)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
            }

            val contentResolver = reactApplicationContext.contentResolver
            val collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI
            val item = contentResolver.insert(collection, values)

            if (item != null) {
                contentResolver.openOutputStream(item).use { outputStream ->
                    FileInputStream(File(filePath)).use { inputStream ->
                        inputStream.copyTo(outputStream!!)
                    }
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    values.clear()
                    values.put(MediaStore.Downloads.IS_PENDING, 0)
                    contentResolver.update(item, values, null, null)
                }

                promise.resolve(item.toString())
            } else {
                promise.reject("ERROR", "Failed to insert file into MediaStore")
            }
        } catch (e: IOException) {
            promise.reject("ERROR", "Failed to save file: ${e.message}")
        }
    }
}