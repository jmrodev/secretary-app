package com.secretaryapp.api

import com.secretaryapp.model.Appointment
import com.secretaryapp.model.Doctor
import com.secretaryapp.model.Patient
import com.secretaryapp.model.PatientFile
import com.secretaryapp.model.StatsResponse
import com.secretaryapp.model.UploadResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*
import com.secretaryapp.model.*


interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @GET("appointments")
    suspend fun getAppointments(@Header("Authorization") token: String): Response<List<Appointment>>

    @GET("users/doctors")
    suspend fun getDoctors(@Header("Authorization") token: String): Response<List<Doctor>>

    @GET("users/patients")
    suspend fun getPatients(@Header("Authorization") token: String): Response<List<Patient>>

    @PUT("appointments/{id}")
    suspend fun updateAppointment(@Header("Authorization") token: String, @Path("id") id: Int, @Body body: UpdateReasonRequest): Response<Void>
    
    @PUT("appointments/{id}/status")
    suspend fun updateStatus(@Header("Authorization") token: String, @Path("id") id: Int, @Body body: UpdateStatusRequest): Response<Void>
    
    @PUT("appointments/{id}/payment")
    suspend fun updatePayment(@Header("Authorization") token: String, @Path("id") id: Int, @Body body: UpdatePaymentRequest): Response<Void>
    
    // File endpoints
    @Multipart
    @POST("medical/files")
    suspend fun uploadFile(
        @Header("Authorization") token: String,
        @Part("patient_id") patientId: RequestBody,
        @Part("description") description: RequestBody,
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>
    
    @GET("medical/files")
    suspend fun getPatientFiles(
        @Header("Authorization") token: String,
        @Query("patient_id") patientId: Int
    ): Response<List<PatientFile>>

    @GET("users/patients/{id}")
    suspend fun getPatientDetails(
        @Header("Authorization") token: String,
        @Path("id") id: Int
    ): Response<com.secretaryapp.model.PatientDetailsResponse>

    @GET("users/reminders")
    suspend fun getReminders(
        @Header("Authorization") token: String
    ): Response<List<Patient>>

    @GET("users/stats")
    suspend fun getStats(
        @Header("Authorization") token: String
    ): Response<StatsResponse>

    // Messaging endpoints
    @GET("messages/inbox")
    suspend fun getInbox(@Header("Authorization") token: String): Response<List<com.secretaryapp.model.Message>>

    @GET("messages/sent")
    suspend fun getSent(@Header("Authorization") token: String): Response<List<com.secretaryapp.model.Message>>

    @GET("messages/unread-count")
    suspend fun getUnreadCount(@Header("Authorization") token: String): Response<UnreadCountResponse>

    @GET("messages/recipients")
    suspend fun getRecipients(@Header("Authorization") token: String): Response<List<Recipient>>

    @GET("messages/conversations")
    suspend fun getConversations(@Header("Authorization") token: String): Response<List<Message>>

    @GET("messages/thread/{otherId}")
    suspend fun getThread(@Header("Authorization") token: String, @Path("otherId") otherId: Int): Response<List<Message>>

    @GET("messages/{id}")
    suspend fun getMessage(@Header("Authorization") token: String, @Path("id") id: Int): Response<Message>

    @POST("messages")
    suspend fun sendMessage(@Header("Authorization") token: String, @Body message: SendMessageRequest): Response<MessageResponse>

    @PUT("messages/{id}/read")
    suspend fun markAsRead(@Header("Authorization") token: String, @Path("id") id: Int): Response<com.secretaryapp.model.MessageResponse>

    @DELETE("messages/{id}")
    suspend fun deleteMessage(@Header("Authorization") token: String, @Path("id") id: Int): Response<com.secretaryapp.model.MessageResponse>

    @POST("messages/typing")
    suspend fun notifyTyping(@Header("Authorization") token: String, @Body request: com.secretaryapp.model.TypingRequest): Response<com.secretaryapp.model.MessageResponse>

    @GET("messages/typing/{other_id}")
    suspend fun getTypingStatus(@Header("Authorization") token: String, @Path("other_id") otherId: Int): Response<com.secretaryapp.model.TypingStatus>
}



data class UpdateReasonRequest(val reason: String, val appointment_date: String)
data class UpdateStatusRequest(val status: String)
data class UpdatePaymentRequest(val status: String)

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val token: String,
    val user_id: Int,
    val username: String,
    val role: String
)
