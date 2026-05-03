package com.secretaryapp

import android.os.Bundle
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.PatientFile
import com.secretaryapp.ui.PatientFileAdapter
import com.secretaryapp.utils.NetworkErrorMapper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PatientFilesActivity : AppCompatActivity() {
    
    private lateinit var adapter: PatientFileAdapter
    private var patientId: Int = 0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_patient_files)
        
        patientId = intent.getIntExtra("patientId", 0)
        val patientName = intent.getStringExtra("patient_name") ?: "Paciente"
        
        findViewById<TextView>(R.id.tvFilesTitle).text = "Archivos de $patientName"
        
        val rvFiles = findViewById<RecyclerView>(R.id.rvPatientFiles)
        rvFiles.layoutManager = LinearLayoutManager(this)
        adapter = PatientFileAdapter(listOf())
        rvFiles.adapter = adapter
        
        loadFiles()
    }
    
    private fun loadFiles() {
        val authToken = SessionManager.authToken ?: return
        
        android.util.Log.d("PatientFilesActivity", "Token: $authToken")
        android.util.Log.d("PatientFilesActivity", "Patient ID: $patientId")
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getPatientFiles(
                    authToken,
                    patientId
                )
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body() != null) {
                        val files = response.body()!!
                        adapter.updateList(files)
                        
                        if (files.isEmpty()) {
                            Toast.makeText(this@PatientFilesActivity, 
                                "No hay archivos", 
                                Toast.LENGTH_SHORT).show()
                        }
                    } else {
                        Toast.makeText(this@PatientFilesActivity, 
                            "Error al cargar archivos", 
                            Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@PatientFilesActivity)
                    Toast.makeText(this@PatientFilesActivity, errorMessage, Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
