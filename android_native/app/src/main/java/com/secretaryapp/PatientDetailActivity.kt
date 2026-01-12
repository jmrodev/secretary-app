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
import androidx.work.*
import com.secretaryapp.utils.NetworkErrorMapper
import com.secretaryapp.workers.UploadWorker
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

        // Restore state if available
        savedInstanceState?.let {
            currentPhotoPath = it.getString("currentPhotoPath")
            currentDocumentType = it.getString("currentDocumentType")
        }

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

        loadPatientDetails()
        observeUploads()
    }

    private fun loadPatientDetails() {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getPatientDetails(authToken, patientId)
                if (response.isSuccessful && response.body() != null) {
                    val details = response.body()!!
                    withContext(Dispatchers.Main) {
                        findViewById<TextView>(R.id.tvNextVisit).text = "📅 Visita: ${details.next_suggested_visit_date?.split("T")?.get(0) ?: "N/A"}"
                        findViewById<TextView>(R.id.tvNextPrescr).text = "💊 Receta: ${details.next_suggested_prescription_date?.split("T")?.get(0) ?: "N/A"}"
                        findViewById<TextView>(R.id.tvLicExpiry).text = "📄 Licencia: ${details.license_expiry_date?.split("T")?.get(0) ?: "N/A"}"
                    }
                }
            } catch (e: Exception) {
                // Silent error for details
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString("currentPhotoPath", currentPhotoPath)
        outState.putString("currentDocumentType", currentDocumentType)
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
        val typeLabel = when(currentDocumentType) {
            "Licencia Médica" -> "licencia"
            "Receta" -> "receta"
            "Certificado" -> "certificado"
            else -> "documento"
        }
        val dateStamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
        val fileName = "${typeLabel}_${dateStamp}"
        val storageDir = getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        return File.createTempFile(
            "${fileName}_",
            ".jpg",
            storageDir
        )
    }
    
    private fun uploadPhoto() {
        val path = currentPhotoPath ?: return
        val file = File(path)
        
        if (!file.exists()) {
            Toast.makeText(this, "Archivo no encontrado", Toast.LENGTH_SHORT).show()
            return
        }
        
        val authToken = SessionManager.authToken
        if (authToken == null) {
            Toast.makeText(this, "Error de sesión. Por favor reingrese.", Toast.LENGTH_LONG).show()
            return
        }

        val description = currentDocumentType ?: "Desconocido"
        
        val uploadData = workDataOf(
            "authToken" to authToken,
            "patientId" to patientId,
            "photoPath" to path,
            "description" to description
        )

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
            .setConstraints(constraints)
            .setInputData(uploadData)
            .setBackoffCriteria(
                BackoffPolicy.LINEAR,
                WorkRequest.MIN_BACKOFF_MILLIS,
                java.util.concurrent.TimeUnit.MILLISECONDS
            )
            .addTag("upload_${patientId}")
            .build()

        WorkManager.getInstance(applicationContext).enqueueUniqueWork(
            "upload_${path.hashCode()}",
            ExistingWorkPolicy.REPLACE,
            uploadRequest
        )
        
        Toast.makeText(this, getString(R.string.msg_upload_queued), Toast.LENGTH_SHORT).show()
    }

    private fun observeUploads() {
        WorkManager.getInstance(applicationContext)
            .getWorkInfosByTagLiveData("upload_${patientId}")
            .observe(this) { workInfos ->
                val workInfo = workInfos?.find { !it.state.isFinished } ?: workInfos?.firstOrNull()
                
                workInfo?.let {
                    when (it.state) {
                        WorkInfo.State.ENQUEUED -> {
                            // Already handled by toast in uploadPhoto, but could show a persistent indicator
                        }
                        WorkInfo.State.RUNNING -> {
                            Toast.makeText(this, getString(R.string.msg_uploading), Toast.LENGTH_SHORT).show()
                        }
                        WorkInfo.State.SUCCEEDED -> {
                            Toast.makeText(this, getString(R.string.msg_upload_success), Toast.LENGTH_SHORT).show()
                        }
                        WorkInfo.State.FAILED -> {
                            Toast.makeText(this, getString(R.string.error_unknown), Toast.LENGTH_SHORT).show()
                        }
                        WorkInfo.State.BLOCKED -> { }
                        WorkInfo.State.CANCELLED -> { }
                    }
                }
            }
    }
}
