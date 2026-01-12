package com.secretaryapp.model

data class Appointment(
    val id: Int,
    val patient_name: String?,
    val doctor_name: String?,
    val appointment_date: String, // ISO String
    val status: String, // pending, completed, cancelled
    val reason: String?,
    val doctor_id: Int,
    val patient_id: Int?
)
