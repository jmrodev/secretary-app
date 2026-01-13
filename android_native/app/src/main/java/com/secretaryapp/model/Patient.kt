package com.secretaryapp.model

data class Patient(
    val id: Int,
    val user_id: Int,
    val full_name: String,
    val dni: String?,
    val phone: String?,
    val email: String?,
    val address: String?,
    val behavior_rating: Int = 5,
    val total_debt: Double = 0.0,
    val total_appointments: Int = 0,
    val missed_appointments: Int = 0,
    val visit_interval_days: Int? = null,
    val prescription_interval_days: Int? = null,
    val next_suggested_visit_date: String? = null,
    val next_suggested_prescription_date: String? = null,
    val license_expiry_date: String? = null
)
