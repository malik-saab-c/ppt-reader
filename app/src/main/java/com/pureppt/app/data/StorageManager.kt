package com.pureppt.app.data

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream

object StorageManager {

    /**
     * Saves PPTX byte content directly into the Android device's native Download folder
     * with proper Scoped Storage / MediaStore compliance.
     */
    fun saveToDownloadFolder(
        context: Context,
        fileName: String,
        fileBytes: ByteArray,
        mimeType: String = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ): Uri? {
        val finalFileName = if (fileName.endsWith(".pptx", ignoreCase = true)) fileName else "$fileName.pptx"

        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, finalFileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/PurePPT")
                }

                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)

                uri?.let { destUri ->
                    resolver.openOutputStream(destUri)?.use { outputStream ->
                        outputStream.write(fileBytes)
                        outputStream.flush()
                    }
                    Toast.makeText(context, "Saved to Downloads/PurePPT/$finalFileName", Toast.LENGTH_LONG).show()
                }
                uri
            } else {
                // Legacy Android (Pie and below)
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val targetDir = File(downloadsDir, "PurePPT")
                if (!targetDir.exists()) {
                    targetDir.mkdirs()
                }
                val destFile = File(targetDir, finalFileName)
                FileOutputStream(destFile).use { outputStream ->
                    outputStream.write(fileBytes)
                    outputStream.flush()
                }
                Toast.makeText(context, "Saved to: ${destFile.absolutePath}", Toast.LENGTH_LONG).show()
                Uri.fromFile(destFile)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(context, "Failed to save: ${e.localizedMessage}", Toast.LENGTH_LONG).show()
            null
        }
    }

    /**
     * Reads presentation input stream from content Uri.
     */
    fun openInputStream(context: Context, uri: Uri): InputStream? {
        return context.contentResolver.openInputStream(uri)
    }
}
