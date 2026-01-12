package com.secretaryapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class PatientDetailActivity : AppCompatActivity() {
    private var currentPhotoPath: String? = null
    private var currentDocumentType: String? = null
    private var patientId: Int = 0
    
    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicture()
    ) { success ->
        if (success) {
            uploadPhoto()
        } else {
            Toast.makeText(this, "Foto cancelada", Toast.LENGTH_SHORT).show()
        }
    }
    
    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            takePhoto(currentDocumentType!!)
        } else {
            Toast.makeText(this, "Permiso de cámara denegado", Toast.LENGTH_SHORT).show()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_patient_detail)

        val name = intent.getStringExtra("name")
        val dni = intent.getStringExtra("dni")
        val phone = intent.getStringExtra("phone")
        val email = intent.getStringExtra("email")
        patientId = intent.getIntExtra("patient_id", 0)

        findViewById<TextView>(R.id.tvDetailPatName).text = name
        findViewById<TextView>(R.id.tvDetailPatDni).text = "DNI: $dni"
        findViewById<TextView>(R.id.tvDetailPatPhone).text = "Tel: $phone"
        findViewById<TextView>(R.id.tvDetailPatEmail).text = "Email: $email"
        
        // Botones de documentos
        findViewById<Button>(R.id.btnTakeLicense).setOnClickListener {
            checkCameraPermission("Licencia Médica")
        }
        
        findViewById<Button>(R.id.btnTakePrescription).setOnClickListener {
            checkCameraPermission("Receta")
        }
        
        findViewById<Button>(R.id.btnTakeCertificate).setOnClickListener {
            checkCameraPermission("Certificado")
        }
        
        findViewById<Button>(R.id.btnViewFiles).setOnClickListener {
            val intent = Intent(this, PatientFilesActivity::class.java)
            intent.putExtra("patient_id", patientId)
            intent.putExtra("patient_name", name)
            startActivity(intent)
        }
    }
    
    private fun checkCameraPermission(documentType: String) {
        currentDocumentType = documentType
        
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        } else {
            takePhoto(documentType)
        }
    }
    
    private fun takePhoto(documentType: String) {
        currentDocumentType = documentType
        
        try {
            val photoFile = createImageFile()
            currentPhotoPath = photoFile.absolutePath
            
            val photoURI = FileProvider.getUriForFile(
                this,
                "com.secretaryapp.fileprovider",
                photoFile
            )
            
            takePictureLauncher.launch(photoURI)
        } catch (e: Exception) {
            Toast.makeText(this, "Error al crear archivo: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }
    
    private fun createImageFile(): File {
        val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(
            "IMG_${timestamp}_",
            ".jpg",
            storageDir
        )
    }
    
    private fun uploadPhoto() {
        val file = File(currentPhotoPath ?: return)
        
        if (!file.exists()) {
            Toast.makeText(this, "Archivo no encontrado", Toast.LENGTH_SHORT).show()
            return
        }
        
        Toast.makeText(this, "Subiendo foto...", Toast.LENGTH_SHORT).show()
        
        val requestFile = file.asRequestBody("image/jpeg".toMediaTypeOrNull())
        val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
        
        val patientIdBody = patientId.toString().toRequestBody("text/plain".toMediaTypeOrNull())
        val descriptionBody = currentDocumentType?.toRequestBody("text/plain".toMediaTypeOrNull())
        
        android.util.Log.d("PatientDetailActivity", "Uploading - Token: ${SessionManager.authToken}")
        android.util.Log.d("PatientDetailActivity", "Patient ID: $patientId")
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.uploadFile(
                    SessionManager.authToken ?: return@launch,
                    patientIdBody,
                    descriptionBody!!,
                    body
                )
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@PatientDetailActivity, 
                            "Archivo subido correctamente", 
                            Toast.LENGTH_SHORT).show()
                        // Eliminar archivo temporal
                        file.delete()
                    } else {
                        Toast.makeText(this@PatientDetailActivity, 
                            "Error al subir archivo: ${response.code()}", 
                            Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@PatientDetailActivity, 
                        "Error: ${e.message}", 
                        Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}
