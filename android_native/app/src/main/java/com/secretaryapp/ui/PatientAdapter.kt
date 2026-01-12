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

        fun bind(patient: Patient) {
            tvName.text = patient.full_name
            tvDni.text = "DNI: ${patient.dni ?: "N/A"}"
            
            itemView.setOnClickListener {
                val intent = Intent(itemView.context, PatientDetailActivity::class.java).apply {
                    putExtra("patient_id", patient.id)
                    putExtra("name", patient.full_name)
                    putExtra("dni", patient.dni)
                    putExtra("phone", patient.phone)
                    putExtra("email", patient.email)
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
