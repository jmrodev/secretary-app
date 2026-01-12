package com.secretaryapp

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.ui.AppointmentAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.secretaryapp.utils.NetworkErrorMapper

class AppointmentsActivity : AppCompatActivity() {

    private lateinit var adapter: AppointmentAdapter
    private var allAppointments: List<com.secretaryapp.model.Appointment> = listOf()
    private var allDoctors: List<com.secretaryapp.model.Doctor> = listOf()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_appointments)

        val rvAppointments = findViewById<RecyclerView>(R.id.rvAppointments)
        val spinnerDoctors = findViewById<android.widget.Spinner>(R.id.spinnerDoctors)
        
        rvAppointments.layoutManager = LinearLayoutManager(this)
        adapter = AppointmentAdapter()
        rvAppointments.adapter = adapter

        // Setup filter for Secretary
        if (SessionManager.role == "secretary" || SessionManager.role == "admin") {
            spinnerDoctors.visibility = android.view.View.VISIBLE
            setupDoctorSpinner(spinnerDoctors)
        }

        // fetchAppointments() removed from onCreate
    }

    override fun onResume() {
        super.onResume()
        fetchAppointments()
    }

    private fun setupDoctorSpinner(spinner: android.widget.Spinner) {
         val authToken = SessionManager.authToken ?: return
         CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getDoctors(authToken)
                if (response.isSuccessful) {
                    allDoctors = response.body() ?: emptyList()
                    withContext(Dispatchers.Main) {
                        val displayList = mutableListOf("All Doctors")
                        displayList.addAll(allDoctors.map { it.full_name })
                        
                        val adapter = android.widget.ArrayAdapter(this@AppointmentsActivity, android.R.layout.simple_spinner_dropdown_item, displayList)
                        spinner.adapter = adapter
                        
                        spinner.onItemSelectedListener = object : android.widget.AdapterView.OnItemSelectedListener {
                            override fun onItemSelected(parent: android.widget.AdapterView<*>, view: android.view.View?, position: Int, id: Long) {
                                filterAppointments(if (position == 0) null else allDoctors[position - 1].id)
                            }
                            override fun onNothingSelected(parent: android.widget.AdapterView<*>) {}
                        }
                    }
                }
            } catch (e: Exception) { 
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@AppointmentsActivity)
                    Toast.makeText(this@AppointmentsActivity, errorMessage, Toast.LENGTH_LONG).show()
                }
            }
         }
    }

    private fun filterAppointments(doctorId: Int?) {
        if (doctorId == null) {
            adapter.submitList(allAppointments)
        } else {
            val filtered = allAppointments.filter { it.doctor_id == doctorId }
            adapter.submitList(filtered)
        }
    }

    private fun fetchAppointments() {
        val authToken = SessionManager.authToken ?: return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getAppointments(authToken)
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        allAppointments = response.body() ?: emptyList()
                        Toast.makeText(this@AppointmentsActivity, "Loaded ${allAppointments.size} appointments", Toast.LENGTH_LONG).show()
                        // Initial filter: if user is doctor, show only theirs? Backend usually handles this, but client side check:
                        adapter.submitList(allAppointments)
                    } else {
                        Toast.makeText(this@AppointmentsActivity, "Failed to load: ${response.code()}", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@AppointmentsActivity)
                    Toast.makeText(this@AppointmentsActivity, errorMessage, Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
