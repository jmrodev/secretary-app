package com.secretaryapp

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Patient
import com.secretaryapp.ui.PatientAdapter
import com.secretaryapp.utils.NetworkErrorMapper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

import android.content.Intent
import android.net.Uri
import com.secretaryapp.workers.UploadWorker
import androidx.work.*

class PatientsActivity : AppCompatActivity() {

    private lateinit var adapter: PatientAdapter
    private var allPatients: List<Patient> = listOf()
    private var sharedFileUri: Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_patients)

        val rvPatients = findViewById<RecyclerView>(R.id.rvPatients)
        val etSearch = findViewById<EditText>(R.id.etSearchPatient)
        
        rvPatients.layoutManager = LinearLayoutManager(this)
        
        // Handle Item click or share upload
        adapter = PatientAdapter(listOf()) { patient ->
            handlePatientClick(patient)
        }
        rvPatients.adapter = adapter

        etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                filter(s.toString())
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        // Check for share intent
        handleIntent(intent)
        
        loadPatients()
    }

    private fun handleIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_SEND) {
            val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            if (uri != null) {
                sharedFileUri = uri
                Toast.makeText(this, "Seleccione el paciente para adjuntar el archivo", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun handlePatientClick(patient: Patient) {
        if (sharedFileUri != null) {
            // It's a share intent upload workflow!
            uploadSharedFile(patient)
        } else {
            // Normal navigation workflow
            val intent = Intent(this, PatientDetailActivity::class.java).apply {
                putExtra("patient_id", patient.id)
                putExtra("name", patient.full_name)
                putExtra("dni", patient.dni)
                putExtra("phone", patient.phone)
                putExtra("email", patient.email)
                putExtra("address", patient.address)
            }
            startActivity(intent)
        }
    }

    private fun uploadSharedFile(patient: Patient) {
        val uri = sharedFileUri ?: return
        val authToken = SessionManager.authToken
        if (authToken == null) {
            Toast.makeText(this, "Error de sesión. Reingrese.", Toast.LENGTH_SHORT).show()
            return
        }

        try {
            // Copy shared file to a local cache to allow worker access
            val inputStream = contentResolver.openInputStream(uri) ?: throw Exception("No se pudo leer el archivo")
            val tempFile = java.io.File(getExternalFilesDir(null), "shared_doc_${System.currentTimeMillis()}.jpg")
            val outputStream = java.io.FileOutputStream(tempFile)
            
            inputStream.copyTo(outputStream)
            
            inputStream.close()
            outputStream.close()

            val uploadData = workDataOf(
                "authToken" to authToken,
                "patientId" to patient.id,
                "photoPath" to tempFile.absolutePath,
                "description" to "Documento Compartido"
            )

            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val uploadRequest = OneTimeWorkRequestBuilder<UploadWorker>()
                .setConstraints(constraints)
                .setInputData(uploadData)
                .addTag("upload_${patient.id}")
                .build()

            WorkManager.getInstance(applicationContext).enqueueUniqueWork(
                "upload_${tempFile.absolutePath.hashCode()}",
                ExistingWorkPolicy.REPLACE,
                uploadRequest
            )

            Toast.makeText(this, "Archivo compartido subiéndose para ${patient.full_name}", Toast.LENGTH_LONG).show()
            
            // Clear uri and finish to keep flow clean
            sharedFileUri = null
            finish()

        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Error al procesar archivo compartido: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }

    private fun loadPatients() {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getPatients(authToken)
                if (response.isSuccessful && response.body() != null) {
                    allPatients = response.body()!!
                    withContext(Dispatchers.Main) {
                        adapter.updateList(allPatients)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@PatientsActivity, "Error loading patients", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                 withContext(Dispatchers.Main) {
                        val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@PatientsActivity)
                        Toast.makeText(this@PatientsActivity, errorMessage, Toast.LENGTH_LONG).show()
                    }
            }
        }
    }

    private fun filter(text: String) {
        val filtered = allPatients.filter {
            it.full_name.contains(text, ignoreCase = true) || 
            (it.dni?.contains(text) == true) ||
            (it.phone?.contains(text) == true)
        }
        adapter.updateList(filtered)
    }
}
