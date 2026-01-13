package com.secretaryapp.ui

import android.content.Intent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.PatientDetailActivity
import com.secretaryapp.R
import com.secretaryapp.model.Patient

class PatientAdapter(private var patients: List<Patient>) :
    RecyclerView.Adapter<PatientAdapter.PatientViewHolder>() {

    class PatientViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvName: TextView = itemView.findViewById(R.id.tvPatientName)
        val tvDni: TextView = itemView.findViewById(R.id.tvPatientDni)
        val tvFinancial: TextView = itemView.findViewById(R.id.tvFinancialStars)
        val tvAttendance: TextView = itemView.findViewById(R.id.tvAttendanceStars)
        val tvBehavior: TextView = itemView.findViewById(R.id.tvBehaviorStars)

        fun bind(patient: Patient) {
            tvName.text = patient.full_name
            tvDni.text = "DNI: ${patient.dni ?: "N/A"} • Tel: ${patient.phone ?: "N/A"}"
            
            val fRating = com.secretaryapp.utils.RatingUtils.calculateFinancialRating(patient.total_debt)
            val aRating = com.secretaryapp.utils.RatingUtils.calculateAttendanceRating(patient.total_appointments, patient.missed_appointments)
            val bRating = patient.behavior_rating ?: 5

            tvFinancial.text = com.secretaryapp.utils.RatingUtils.getStarString(fRating)
            tvAttendance.text = com.secretaryapp.utils.RatingUtils.getStarString(aRating)
            tvBehavior.text = com.secretaryapp.utils.RatingUtils.getStarString(bRating)
            
            itemView.setOnClickListener {
                val intent = Intent(itemView.context, PatientDetailActivity::class.java).apply {
                    putExtra("patient_id", patient.id)
                    putExtra("name", patient.full_name)
                    putExtra("dni", patient.dni)
                    putExtra("phone", patient.phone)
                    putExtra("email", patient.email)
                    putExtra("address", patient.address)
                }
                itemView.context.startActivity(intent)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PatientViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_patient, parent, false)
        return PatientViewHolder(view)
    }

    override fun onBindViewHolder(holder: PatientViewHolder, position: Int) {
        holder.bind(patients[position])
    }

    override fun getItemCount() = patients.size

    fun updateList(newList: List<Patient>) {
        patients = newList
        notifyDataSetChanged()
    }
}
