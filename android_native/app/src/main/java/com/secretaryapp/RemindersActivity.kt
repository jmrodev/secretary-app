package com.secretaryapp

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.ui.ReminderAdapter
import com.secretaryapp.utils.NetworkErrorMapper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class RemindersActivity : AppCompatActivity() {

    private lateinit var adapter: ReminderAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_reminders)

        val rvReminders = findViewById<RecyclerView>(R.id.rvReminders)
        rvReminders.layoutManager = LinearLayoutManager(this)
        
        adapter = ReminderAdapter(listOf()) { patient ->
            // Optionally navigate to patient detail or just toast
            Toast.makeText(this, "Paciente: ${patient.full_name}", Toast.LENGTH_SHORT).show()
        }
        rvReminders.adapter = adapter

        loadReminders()
    }

    private fun loadReminders() {
        val authToken = SessionManager.authToken ?: return
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.getReminders(authToken)
                if (response.isSuccessful && response.body() != null) {
                    val patients = response.body()!!
                    withContext(Dispatchers.Main) {
                        adapter.updateData(patients)
                    }
                } else {
                    withContext(Dispatchers.Main) {
                        Toast.makeText(this@RemindersActivity, "Error al cargar recordatorios", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@RemindersActivity)
                    Toast.makeText(this@RemindersActivity, errorMessage, Toast.LENGTH_LONG).show()
                }
            }
        }
    }
}
