package com.secretaryapp.workers

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.secretaryapp.api.RetrofitClient
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class UploadWorker(appContext: Context, workerParams: WorkerParameters) :
    CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val authToken = inputData.getString("authToken") ?: return Result.failure()
        val patientId = inputData.getInt("patientId", 0)
        val photoPath = inputData.getString("photoPath") ?: return Result.failure()
        val description = inputData.getString("description") ?: "Desconocido"

        val file = File(photoPath)
        if (!file.exists()) {
            return Result.failure()
        }

        return try {
            val requestFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            
            val patientIdBody = patientId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
            val descriptionBody = description.toRequestBody("text/plain".toMediaTypeOrNull())

            val response = RetrofitClient.instance.uploadFile(
                authToken,
                patientIdBody,
                descriptionBody,
                body
            )

            if (response.isSuccessful) {
                // Delete temporal file after success
                if (file.exists()) {
                    file.delete()
                }
                Result.success()
            } else {
                if (response.code() in 500..599) {
                    Result.retry()
                } else {
                    Result.failure()
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
