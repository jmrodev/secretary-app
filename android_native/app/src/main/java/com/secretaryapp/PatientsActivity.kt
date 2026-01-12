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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class PatientsActivity : AppCompatActivity() {

    private lateinit var adapter: PatientAdapter
    private var allPatients: List<Patient> = listOf()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_patients)

        val rvPatients = findViewById<RecyclerView>(R.id.rvPatients)
        val etSearch = findViewById<EditText>(R.id.etSearchPatient)
        
        rvPatients.layoutManager = LinearLayoutManager(this)
        adapter = PatientAdapter( listOf() )
        rvPatients.adapter = adapter

        etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                filter(s.toString())
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        loadPatients()
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
                        Toast.makeText(this@PatientsActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
            }
        }
    }

    private fun filter(text: String) {
        val filtered = allPatients.filter {
            it.full_name.contains(text, ignoreCase = true) || 
            (it.dni?.contains(text) == true)
        }
        adapter.updateList(filtered)
    }
}
