package com.secretaryapp.api

import com.secretaryapp.model.Appointment
import com.secretaryapp.model.Doctor
import com.secretaryapp.model.Patient
import com.secretaryapp.model.PatientFile
import com.secretaryapp.model.UploadResponse
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*


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
