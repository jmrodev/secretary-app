package com.secretaryapp.model

data class Doctor(
    val id: Int,
    val full_name: String,
    val specialty: String?,
    val user_id: Int?
) {
    override fun toString(): String {
        return full_name // For Spinner display
    }
}
