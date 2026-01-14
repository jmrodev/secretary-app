package com.secretaryapp

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Appointment
import com.secretaryapp.model.PatientDetailsResponse
import com.secretaryapp.ui.AppointmentHistoryAdapter
import com.secretaryapp.ui.PatientFileAdapter
import com.secretaryapp.utils.RatingUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class AppointmentDetailActivity : AppCompatActivity() {

    private var appointmentId: Int = 0
    private var currentReason: String? = null
    private lateinit var historyAdapter: AppointmentHistoryAdapter
    private lateinit var filesAdapter: PatientFileAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_appointment_detail)

        val tvPatientName = findViewById<TextView>(R.id.tvDetailPatientName)
        val tvDate = findViewById<TextView>(R.id.tvDetailDate)
        
        // Doctor Views
        val layoutDoctor = findViewById<LinearLayout>(R.id.layoutDoctorActions)
        val etNotes = findViewById<EditText>(R.id.etNotes)
        val btnSaveNotes = findViewById<Button>(R.id.btnSaveNotes)

        // Secretary Views
        val layoutSecretary = findViewById<LinearLayout>(R.id.layoutSecretaryActions)
        val btnConfirm = findViewById<Button>(R.id.btnMarkConfirmed)
        val btnArrived = findViewById<Button>(R.id.btnMarkArrived)
        val btnComplete = findViewById<Button>(R.id.btnMarkCompleted)
        val btnAbsent = findViewById<Button>(R.id.btnMarkAbsent)
        val btnCancelled = findViewById<Button>(R.id.btnMarkCancelled)
        val btnRescheduled = findViewById<Button>(R.id.btnMarkRescheduled)
        val btnPaid = findViewById<Button>(R.id.btnMarkPaid)

        // Get Data
        val id = intent.getIntExtra("appt_id", 0)
        val name = intent.getStringExtra("patient_name")
        val date = intent.getStringExtra("date")
        val reason = intent.getStringExtra("reason")
        val status = intent.getStringExtra("status")
        val paymentStatus = intent.getStringExtra("payment_status")

        appointmentId = id
        currentReason = reason

        tvPatientName.text = name
        tvDate.text = date
        etNotes.setText(reason)

        // Role Logic
        val role = SessionManager.role
        val patientId = intent.getIntExtra("patient_id", 0)

        if (role == "doctor") {
            layoutDoctor.visibility = View.VISIBLE
            layoutSecretary.visibility = View.GONE
            findViewById<View>(R.id.layoutComplianceStars).visibility = View.VISIBLE
            
            setupDoctorRecyclerViews()
            if (patientId != 0) {
                loadPatientDetails(patientId)
            }
        } else if (role == "secretary" || role == "admin") {
            layoutDoctor.visibility = View.GONE
            layoutSecretary.visibility = View.VISIBLE
        } else {
            layoutDoctor.visibility = View.GONE
            layoutSecretary.visibility = View.GONE
        }

        // --- Listeners ---

        // Doctor: Save Notes
        btnSaveNotes.setOnClickListener {
            val newReason = etNotes.text.toString()
            updateAppointment(newReason)
        }

        // Secretary: Status Actions
        btnConfirm.setOnClickListener { updateStatus("confirmed") }
        btnArrived.setOnClickListener { updateStatus("arrived") }
        btnComplete.setOnClickListener { updateStatus("completed") }
        btnAbsent.setOnClickListener { updateStatus("absent") }
        btnCancelled.setOnClickListener { updateStatus("cancelled") }
        btnRescheduled.setOnClickListener { updateStatus("rescheduled") }
        
        // Secretary: Pay
        btnPaid.setOnClickListener { updatePayment("paid") }

        // Update visibility based on status
        updateButtonVisibility(status, paymentStatus)
    }

    private fun updateButtonVisibility(status: String?, paymentStatus: String?) {
        if (status == null) return
        
        val btnConfirm = findViewById<Button>(R.id.btnMarkConfirmed)
        val btnArrived = findViewById<Button>(R.id.btnMarkArrived)
        val btnComplete = findViewById<Button>(R.id.btnMarkCompleted)
        val btnAbsent = findViewById<Button>(R.id.btnMarkAbsent)
        val btnCancelled = findViewById<Button>(R.id.btnMarkCancelled)
        val btnRescheduled = findViewById<Button>(R.id.btnMarkRescheduled)
        val btnPaid = findViewById<Button>(R.id.btnMarkPaid)
        
        if (status == "completed" || status == "cancelled" || status == "absent") {
            btnConfirm.visibility = View.GONE
            btnArrived.visibility = View.GONE
            btnComplete.visibility = View.GONE
            btnAbsent.visibility = View.GONE
            btnCancelled.visibility = View.GONE
            btnRescheduled.visibility = View.GONE
        } else {
             // Default visible
            btnConfirm.visibility = View.VISIBLE
            btnArrived.visibility = View.VISIBLE
            btnComplete.visibility = View.VISIBLE
            btnAbsent.visibility = View.VISIBLE
            btnCancelled.visibility = View.VISIBLE
            btnRescheduled.visibility = View.VISIBLE
            
            // Fine adjustments
            if (status == "arrived") {
                 btnConfirm.visibility = View.GONE
                 btnArrived.visibility = View.GONE
            }
            if (status == "confirmed") {
                 btnConfirm.visibility = View.GONE
            }
        }

        if (paymentStatus == "paid") {
            btnPaid.visibility = View.GONE
        }
    }

    private fun updateAppointment(newReason: String) {
        val authToken = SessionManager.authToken ?: return
        // Keep date same as we don't have date picker here, or pass it from intent
        // For simplicity we might send current date string from UI text or intent
        // But backend requires it. Let's assume we pass it.
        // Actually reason update requires appointment_date in backend updateAppointment
        val dateStr = intent.getStringExtra("date_iso") ?: return 

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.updateAppointment(authToken, appointmentId, 
                    com.secretaryapp.api.UpdateReasonRequest(newReason, dateStr))
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) Toast.makeText(applicationContext, "Notes Saved", Toast.LENGTH_SHORT).show()
                    else Toast.makeText(applicationContext, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch(e: Exception) {
               withContext(Dispatchers.Main) { Toast.makeText(applicationContext, "Err: ${e.message}", Toast.LENGTH_SHORT).show() }
            }
        }
    }

    private fun updateStatus(newStatus: String) {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.updateStatus(authToken, appointmentId, 
                     com.secretaryapp.api.UpdateStatusRequest(newStatus))
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(applicationContext, "Status Updated", Toast.LENGTH_SHORT).show()
                        finish() // Return to list
                    } else Toast.makeText(applicationContext, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch(e: Exception) {
               withContext(Dispatchers.Main) { Toast.makeText(applicationContext, "Err: ${e.message}", Toast.LENGTH_SHORT).show() }
            }
        }
    }

    private fun updatePayment(status: String) {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
             try {
                val response = RetrofitClient.instance.updatePayment(authToken, appointmentId, 
                     com.secretaryapp.api.UpdatePaymentRequest(status))
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(applicationContext, "Payment Updated", Toast.LENGTH_SHORT).show()
                        finish() // Return to list
                    } else Toast.makeText(applicationContext, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch(e: Exception) {
               withContext(Dispatchers.Main) { Toast.makeText(applicationContext, "Err: ${e.message}", Toast.LENGTH_SHORT).show() }
            }
        }
    }
    private fun setupDoctorRecyclerViews() {
        val rvFiles = findViewById<RecyclerView>(R.id.rvPatientFiles)
        val rvHistory = findViewById<RecyclerView>(R.id.rvAppointmentHistory)

        rvFiles.layoutManager = LinearLayoutManager(this)
        filesAdapter = PatientFileAdapter(listOf())
        rvFiles.adapter = filesAdapter

        rvHistory.layoutManager = LinearLayoutManager(this)
        historyAdapter = AppointmentHistoryAdapter(listOf())
        rvHistory.adapter = historyAdapter
    }

    private fun loadPatientDetails(patientId: Int) {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getPatientDetails(authToken, patientId)
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful && response.body() != null) {
                        val details = response.body()!!
                        filesAdapter.updateList(details.files)
                        historyAdapter.updateList(details.appointments)
                        
                        // Last Visit Logic
                        val lastVisit = details.appointments.firstOrNull { it.status == "completed" }
                        if (lastVisit != null) {
                            findViewById<TextView>(R.id.tvLastVisit).text = "Last Visit: ${lastVisit.appointment_date.substring(0, 10)}"
                        }

                        // Compliance Stars
                        findViewById<TextView>(R.id.tvDetailFStars).text = "F: " + RatingUtils.getStarString(RatingUtils.calculateFinancialRating(details.total_debt ?: 0.0))
                        findViewById<TextView>(R.id.tvDetailAStars).text = "A: " + RatingUtils.getStarString(RatingUtils.calculateAttendanceRating(details.total_appointments ?: 0, details.missed_appointments ?: 0))
                        findViewById<TextView>(R.id.tvDetailBStars).text = "B: " + RatingUtils.getStarString(details.behavior_rating ?: 5)
                    }
                }
            } catch (e: Exception) {
                // Non-fatal
            }
        }
    }
}
