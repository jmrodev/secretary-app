package com.secretaryapp.model

data class PatientDetailsResponse(
    val id: Int,
    val full_name: String,
    val dni: String?,
    val phone: String?,
    val email: String?,
    val behavior_rating: Int?,
    val total_debt: Double?,
    val total_appointments: Int?,
    val missed_appointments: Int?,
    val visit_interval_days: Int?,
    val prescription_interval_days: Int?,
    val next_suggested_visit_date: String?,
    val next_suggested_prescription_date: String?,
    val license_expiry_date: String?,
    val appointments: List<Appointment>,
    val files: List<PatientFile>,
    val prescriptions: List<PrescriptionLicense>,
    val assignedDoctors: List<Doctor>
)

data class PrescriptionLicense(
    val id: Int,
    val created_at: String,
    val type: String, // 'prescription' or 'license'
    val doctor_name: String,
    val diagnosis: String?,
    val days: Int?
)
