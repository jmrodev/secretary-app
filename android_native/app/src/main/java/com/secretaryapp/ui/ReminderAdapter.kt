package com.secretaryapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.R
import com.secretaryapp.model.Patient
import java.text.SimpleDateFormat
import java.util.*

class ReminderAdapter(
    private var patients: List<Patient>,
    private val onItemClick: (Patient) -> Unit
) : RecyclerView.Adapter<ReminderAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvName = view.findViewById<TextView>(R.id.tvPatientName)
        val tvVisit = view.findViewById<TextView>(R.id.tvVisitReminder)
        val tvPrescription = view.findViewById<TextView>(R.id.tvPrescriptionReminder)
        val tvLicense = view.findViewById<TextView>(R.id.tvLicenseReminder)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_reminder, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val p = patients[position]
        holder.tvName.text = p.full_name

        val now = Calendar.getInstance().time
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

        // Logic check: only show if date exists and is in the past or today
        val visitDate = p.next_suggested_visit_date?.let { safeParse(it, sdf) }
        val prescDate = p.next_suggested_prescription_date?.let { safeParse(it, sdf) }
        val licDate = p.license_expiry_date?.let { safeParse(it, sdf) }

        holder.tvVisit.visibility = if (visitDate != null && !visitDate.after(now)) {
            holder.tvVisit.text = "📅 Próxima Visita: ${sdf.format(visitDate)}"
            View.VISIBLE
        } else View.GONE

        holder.tvPrescription.visibility = if (prescDate != null && !prescDate.after(now)) {
            holder.tvPrescription.text = "💊 Próxima Receta: ${sdf.format(prescDate)}"
            View.VISIBLE
        } else View.GONE

        holder.tvLicense.visibility = if (licDate != null && !licDate.after(now)) {
            holder.tvLicense.text = "📄 Vencimiento Licencia: ${sdf.format(licDate)}"
            View.VISIBLE
        } else View.GONE

        holder.itemView.setOnClickListener { onItemClick(p) }
    }

    private fun safeParse(dateStr: String, sdf: SimpleDateFormat): Date? {
        return try {
            // Trim potential time part if server sends it
            val cleanStr = dateStr.split("T")[0]
            sdf.parse(cleanStr)
        } catch (e: Exception) {
            null
        }
    }

    override fun getItemCount() = patients.size

    fun updateData(newPatients: List<Patient>) {
        patients = newPatients
        notifyDataSetChanged()
    }
}
