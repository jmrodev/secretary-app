package com.secretaryapp.model

data class Patient(
    val id: Int,
    val full_name: String,
    val dni: String?,
    val phone: String?,
    val email: String?
)
