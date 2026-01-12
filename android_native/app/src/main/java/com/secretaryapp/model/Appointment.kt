package com.secretaryapp.model

data class Appointment(
    val id: Int,
    val patient_name: String?,
    val doctor_name: String?,
    val appointment_date: String, // ISO String
    val status: String, // pending, confirmed, completed, cancelled, arrived, etc.
    val payment_status: String?, // pending, paid, debt, partial
    val reason: String?,
    val doctor_id: Int,
    val patient_id: Int?,
    val behavior_rating: Int?,
    val total_debt: Double?,
    val total_appointments: Int?,
    val missed_appointments: Int?
)
