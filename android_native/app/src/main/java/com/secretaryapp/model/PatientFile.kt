package com.secretaryapp.model

data class PatientFile(
    val id: Int,
    val patient_id: Int,
    val file_name: String,
    val file_url: String,
    val file_type: String?,
    val description: String?,
    val created_at: String,
    val uploader_name: String,
    val patient_name: String
)
