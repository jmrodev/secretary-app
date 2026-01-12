package com.secretaryapp.model

data class StatsResponse(
    val appointments_today: Int,
    val appointments_week: Int,
    val appointments_month: Int,
    val total_appointments: Int,
    val total_patients: Int,
    val total_contacts: Int
)
