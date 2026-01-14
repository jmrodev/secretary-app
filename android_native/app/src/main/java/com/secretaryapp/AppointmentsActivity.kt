package com.secretaryapp

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.tabs.TabLayout
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.ui.AppointmentAdapter
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.secretaryapp.utils.NetworkErrorMapper
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.temporal.WeekFields
import java.util.Locale

enum class FilterMode { TODAY, WEEK, MONTH, ALL }

class AppointmentsActivity : AppCompatActivity() {

    private lateinit var adapter: AppointmentAdapter
    private var allAppointments: List<com.secretaryapp.model.Appointment> = listOf()
    private var allDoctors: List<com.secretaryapp.model.Doctor> = listOf()

    // Filter States
    private var currentFilterMode = FilterMode.TODAY
    private var currentSearchQuery = ""
    private var currentDoctorFilterId: Int? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_appointments)

        val rvAppointments = findViewById<RecyclerView>(R.id.rvAppointments)
        val spinnerDoctors = findViewById<android.widget.Spinner>(R.id.spinnerDoctors)
        val etSearch = findViewById<EditText>(R.id.etSearch)
        val tabLayoutFilters = findViewById<TabLayout>(R.id.tabLayoutFilters)
        
        rvAppointments.layoutManager = LinearLayoutManager(this)
        adapter = AppointmentAdapter()
        rvAppointments.adapter = adapter

        // Setup filter for Secretary
        if (SessionManager.role == "secretary" || SessionManager.role == "admin") {
            spinnerDoctors.visibility = android.view.View.VISIBLE
            setupDoctorSpinner(spinnerDoctors)
        }

        // Search Listener
        etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                currentSearchQuery = s.toString()
                applyFilters()
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })

        // Tab Listener
        tabLayoutFilters.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                currentFilterMode = when (tab?.position) {
                    0 -> FilterMode.TODAY
                    1 -> FilterMode.WEEK
                    2 -> FilterMode.MONTH
                    else -> FilterMode.ALL
                }
                applyFilters()
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
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
                                currentDoctorFilterId = if (position == 0) null else allDoctors[position - 1].id
                                applyFilters()
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

    private fun applyFilters() {
        val result = allAppointments.filter { appt ->
            // 1. Doctor Filter
            val doctorMatch = currentDoctorFilterId?.let { it == appt.doctor_id } ?: true

            // 2. Search Filter
            val searchMatch = if (currentSearchQuery.isBlank()) true else {
                (appt.patient_name?.contains(currentSearchQuery, ignoreCase = true) == true) || 
                (appt.reason?.contains(currentSearchQuery, ignoreCase = true) == true)
            }

            // 3. Date Filter
            val dateMatch = try {
                // Ensure resilient parsing. 
                // DB sends: "2026-06-03T09:00:00.000Z" or similar
                val dateString = if (appt.appointment_date.endsWith("Z")) appt.appointment_date else "${appt.appointment_date}Z"
                val apptDateTime = LocalDateTime.parse(dateString, DateTimeFormatter.ISO_DATE_TIME)
                val apptDate = apptDateTime.toLocalDate()
                val today = LocalDate.now()

                when (currentFilterMode) {
                    FilterMode.TODAY -> apptDate.isEqual(today)
                    FilterMode.WEEK -> {
                        val fieldISO = WeekFields.of(Locale.getDefault()).dayOfWeek()
                        val startOfWeek = today.with(fieldISO, 1) 
                        val endOfWeek = today.with(fieldISO, 7)
                        !apptDate.isBefore(startOfWeek) && !apptDate.isAfter(endOfWeek)
                    }
                    FilterMode.MONTH -> {
                         apptDate.year == today.year && apptDate.month == today.month
                    }
                    FilterMode.ALL -> true
                }
            } catch (e: Exception) {
                false
            }

            doctorMatch && searchMatch && dateMatch
        }.sortedBy { it.appointment_date }
        
        adapter.submitList(result)
    }

    private fun fetchAppointments() {
        val authToken = SessionManager.authToken ?: return

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getAppointments(authToken)
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        allAppointments = response.body() ?: emptyList()
                        applyFilters()
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
