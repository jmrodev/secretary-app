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
        val tvPaymentStatus: TextView = itemView.findViewById(R.id.tvPaymentStatus)
        val tvFinancial: TextView = itemView.findViewById(R.id.tvFinancialStars)
        val tvAttendance: TextView = itemView.findViewById(R.id.tvAttendanceStars)
        val tvBehavior: TextView = itemView.findViewById(R.id.tvBehaviorStars)

        fun bind(appt: Appointment) {
            // Stars
            tvFinancial.text = com.secretaryapp.utils.RatingUtils.getStarString(com.secretaryapp.utils.RatingUtils.calculateFinancialRating(appt.total_debt ?: 0.0)).take(1) // Single star for space
            tvAttendance.text = com.secretaryapp.utils.RatingUtils.getStarString(com.secretaryapp.utils.RatingUtils.calculateAttendanceRating(appt.total_appointments ?: 0, appt.missed_appointments ?: 0)).take(1)
            tvBehavior.text = com.secretaryapp.utils.RatingUtils.getStarString(appt.behavior_rating ?: 5).take(1)
            
            // If patient name is missing (e.g. Google Event), use reason/summary if available
            val pName = if (!appt.patient_name.isNullOrEmpty()) appt.patient_name else (appt.reason ?: "Unknown / Google Event")
            tvPatientName.text = pName
            tvDoctorName.text = "Dr. ${appt.doctor_name ?: "Unknown"}"
            
            // Appointment Status
            val statusMap = mapOf(
                "pending" to "Pendiente",
                "confirmed" to "Confirmado",
                "arrived" to "Llegó",
                "completed" to "Atendido",
                "cancelled" to "Cancelado",
                "absent" to "Ausente",
                "rescheduled" to "Reprogramado"
            )
            tvStatus.text = (statusMap[appt.status] ?: appt.status).uppercase()
            
            val statusColorRes = when(appt.status) {
                "pending" -> R.color.status_pending
                "confirmed" -> R.color.status_confirmed
                "arrived" -> R.color.status_arrived
                "completed" -> R.color.status_completed
                "cancelled" -> R.color.status_cancelled
                "absent" -> R.color.status_absent
                "rescheduled" -> R.color.status_rescheduled
                else -> android.R.color.darker_gray
            }
            tvStatus.setBackgroundResource(statusColorRes)

            // Payment Status
            if (!appt.payment_status.isNullOrEmpty() && appt.payment_status != "pending") {
                tvPaymentStatus.visibility = View.VISIBLE
                val paymentMap = mapOf(
                    "paid" to "PAGADO",
                    "debt" to "DEUDA",
                    "partial" to "PARCIAL"
                )
                tvPaymentStatus.text = paymentMap[appt.payment_status] ?: appt.payment_status?.uppercase()
                
                val paymentColorRes = when(appt.payment_status) {
                    "paid" -> R.color.payment_paid
                    "debt" -> R.color.payment_debt
                    "partial" -> R.color.payment_partial
                    else -> R.color.payment_pending
                }
                tvPaymentStatus.setBackgroundResource(paymentColorRes)
            } else {
                tvPaymentStatus.visibility = View.GONE
            }
            
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
