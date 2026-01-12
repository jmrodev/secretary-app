package com.secretaryapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.R
import com.secretaryapp.model.Appointment
import java.text.SimpleDateFormat
import java.util.Locale

class AppointmentAdapter : RecyclerView.Adapter<AppointmentAdapter.ViewHolder>() {

    private var appointments: List<Appointment> = emptyList()

    fun submitList(newData: List<Appointment>) {
        appointments = newData
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_appointment, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(appointments[position])
    }

    override fun getItemCount(): Int = appointments.size

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvPatientName: TextView = itemView.findViewById(R.id.tvPatientName)
        val tvDoctorName: TextView = itemView.findViewById(R.id.tvDoctorName)
        val tvDate: TextView = itemView.findViewById(R.id.tvDate)
        val tvStatus: TextView = itemView.findViewById(R.id.tvStatus)

        fun bind(appt: Appointment) {
            // If patient name is missing (e.g. Google Event), use reason/summary if available
            val pName = if (!appt.patient_name.isNullOrEmpty()) appt.patient_name else (appt.reason ?: "Unknown / Google Event")
            tvPatientName.text = pName
            tvDoctorName.text = "Dr. ${appt.doctor_name ?: "Unknown"}"
            val statusMap = mapOf(
                "pending" to "Pendiente",
                "confirmed" to "Confirmado",
                "completed" to "Atendido",
                "cancelled" to "Cancelado",
                "absent" to "Ausente"
            )
            tvStatus.text = (statusMap[appt.status] ?: appt.status).uppercase()
            
            // Basic date formatting
            val displayDate = try {
                 appt.appointment_date.replace("T", " ").take(16)
            } catch (e: Exception) {
                appt.appointment_date
            }
            tvDate.text = displayDate
            
            itemView.setOnClickListener {
                val intent = android.content.Intent(itemView.context, com.secretaryapp.AppointmentDetailActivity::class.java).apply {
                    putExtra("appt_id", appt.id)
                    putExtra("patient_name", appt.patient_name)
                    putExtra("doctor_name", appt.doctor_name)
                    putExtra("date", displayDate)
                    putExtra("date_iso", appt.appointment_date)
                    putExtra("reason", appt.reason)
                    putExtra("status", appt.status)
                }
                itemView.context.startActivity(intent)
            }
        }
    }
}
