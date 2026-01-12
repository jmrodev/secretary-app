package com.secretaryapp.model

data class Doctor(
    val id: Int,
    val full_name: String,
    val specialty: String?,
    val user_id: Int?,
    val default_visit_interval_days: Int? = null,
    val default_prescription_interval_days: Int? = null
) {
    override fun toString(): String {
        return full_name // For Spinner display
    }
}
