package com.secretaryapp

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.secretaryapp.api.SessionManager

class DashboardActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val tvWelcome = findViewById<TextView>(R.id.tvWelcome)
        val btnAppointments = findViewById<Button>(R.id.btnAppointments)
        val btnLogout = findViewById<Button>(R.id.btnLogout)

        tvWelcome.text = getString(R.string.welcome_fmt, SessionManager.username)

        btnAppointments.setOnClickListener {
            startActivity(Intent(this, AppointmentsActivity::class.java))
        }

        findViewById<Button>(R.id.btnPatients).setOnClickListener {
             startActivity(Intent(this, PatientsActivity::class.java))
        }

        btnLogout.setOnClickListener {
            SessionManager.clear()
            startActivity(Intent(this, MainActivity::class.java))
            finish() // Close Dashboard
        }
    }
}
