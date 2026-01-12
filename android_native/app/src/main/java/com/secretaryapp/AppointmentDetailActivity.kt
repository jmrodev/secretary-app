package com.secretaryapp

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Appointment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class AppointmentDetailActivity : AppCompatActivity() {

    private var appointmentId: Int = 0
    private var currentReason: String? = null

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
        val btnComplete = findViewById<Button>(R.id.btnMarkCompleted)
        val btnAbsent = findViewById<Button>(R.id.btnMarkAbsent)
        val btnPaid = findViewById<Button>(R.id.btnMarkPaid)

        // Get Data
        val id = intent.getIntExtra("appt_id", 0)
        val name = intent.getStringExtra("patient_name")
        val date = intent.getStringExtra("date")
        val reason = intent.getStringExtra("reason")
        val status = intent.getStringExtra("status")

        appointmentId = id
        currentReason = reason

        tvPatientName.text = name
        tvDate.text = date
        etNotes.setText(reason)

        // Role Logic
        val role = SessionManager.role
        if (role == "doctor") {
            layoutDoctor.visibility = View.VISIBLE
            layoutSecretary.visibility = View.GONE
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
        btnComplete.setOnClickListener { updateStatus("completed") }
        btnAbsent.setOnClickListener { updateStatus("absent") }
        
        // Secretary: Pay
        btnPaid.setOnClickListener { updatePayment("paid") }
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
                    if (response.isSuccessful) Toast.makeText(applicationContext, "Status Updated", Toast.LENGTH_SHORT).show()
                    else Toast.makeText(applicationContext, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
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
                    if (response.isSuccessful) Toast.makeText(applicationContext, "Payment Updated", Toast.LENGTH_SHORT).show()
                    else Toast.makeText(applicationContext, "Error: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch(e: Exception) {
               withContext(Dispatchers.Main) { Toast.makeText(applicationContext, "Err: ${e.message}", Toast.LENGTH_SHORT).show() }
            }
        }
    }
}
