package com.secretaryapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.R
import com.secretaryapp.model.Appointment

class AppointmentHistoryAdapter(private var appointments: List<Appointment>) :
    RecyclerView.Adapter<AppointmentHistoryAdapter.HistoryViewHolder>() {

    class HistoryViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvDate: TextView = itemView.findViewById(R.id.tvHistoryDate)
        val tvReason: TextView = itemView.findViewById(R.id.tvHistoryReason)
        val tvStatus: TextView = itemView.findViewById(R.id.tvHistoryStatus)

        fun bind(appt: Appointment) {
            tvDate.text = appt.appointment_date.substring(0, 16).replace("T", " ")
            tvReason.text = appt.reason ?: "Sin motivo"
            tvStatus.text = appt.status
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): HistoryViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_appointment_history, parent, false)
        return HistoryViewHolder(view)
    }

    override fun onBindViewHolder(holder: HistoryViewHolder, position: Int) {
        holder.bind(appointments[position])
    }

    override fun getItemCount() = appointments.size

    fun updateList(newList: List<Appointment>) {
        appointments = newList
        notifyDataSetChanged()
    }
}
