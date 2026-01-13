package com.secretaryapp

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.secretaryapp.api.SessionManager
import com.secretaryapp.api.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class DashboardActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val tvWelcome = findViewById<TextView>(R.id.tvWelcome)
        val btnAppointments = findViewById<Button>(R.id.btnAppointments)
        val btnLogout = findViewById<Button>(R.id.btnLogout)

        // Stats TextViews
        val tvStatsToday = findViewById<TextView>(R.id.tvStatsToday)
        val tvStatsWeek = findViewById<TextView>(R.id.tvStatsWeek)
        val tvStatsMonth = findViewById<TextView>(R.id.tvStatsMonth)
        val tvStatsTotal = findViewById<TextView>(R.id.tvStatsTotal)
        val tvStatsPatients = findViewById<TextView>(R.id.tvStatsPatients)
        val tvStatsContacts = findViewById<TextView>(R.id.tvStatsContacts)

        tvWelcome.text = getString(R.string.welcome_fmt, SessionManager.username)

        btnAppointments.setOnClickListener {
            startActivity(Intent(this, AppointmentsActivity::class.java))
        }

        findViewById<Button>(R.id.btnPatients).setOnClickListener {
             startActivity(Intent(this, PatientsActivity::class.java))
        }

        findViewById<Button>(R.id.btnReminders).setOnClickListener {
            startActivity(Intent(this, RemindersActivity::class.java))
        }

        findViewById<Button>(R.id.btnMessages).setOnClickListener {
            startActivity(Intent(this, MessagesActivity::class.java))
        }

        btnLogout.setOnClickListener {
            SessionManager.clear()
            startActivity(Intent(this, MainActivity::class.java))
            finish() // Close Dashboard
        }


        // Fetch stats
        fetchStats(tvStatsToday, tvStatsWeek, tvStatsMonth, tvStatsTotal, tvStatsPatients, tvStatsContacts)
    }

    private fun fetchStats(
        tvToday: TextView,
        tvWeek: TextView,
        tvMonth: TextView,
        tvTotal: TextView,
        tvPatients: TextView,
        tvContacts: TextView
    ) {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getStats(authToken)
                if (response.isSuccessful && response.body() != null) {
                    val stats = response.body()!!
                    withContext(Dispatchers.Main) {
                        tvToday.text = stats.appointments_today.toString()
                        tvWeek.text = stats.appointments_week.toString()
                        tvMonth.text = stats.appointments_month.toString()
                        tvTotal.text = stats.total_appointments.toString()
                        tvPatients.text = stats.total_patients.toString()
                        tvContacts.text = stats.total_contacts.toString()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
