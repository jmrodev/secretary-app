package com.secretaryapp.ui

import android.content.Intent
import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.R
import com.secretaryapp.model.PatientFile

class PatientFileAdapter(private var files: List<PatientFile>) :
    RecyclerView.Adapter<PatientFileAdapter.FileViewHolder>() {

    class FileViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val tvFileName: TextView = itemView.findViewById(R.id.tvFileName)
        val tvFileDescription: TextView = itemView.findViewById(R.id.tvFileDescription)
        val tvFileDate: TextView = itemView.findViewById(R.id.tvFileDate)

        fun bind(file: PatientFile) {
            tvFileName.text = file.file_name
            tvFileDescription.text = file.description ?: "Sin descripción"
            tvFileDate.text = file.created_at.substring(0, 10) // Solo fecha
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): FileViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_patient_file, parent, false)
        return FileViewHolder(view)
    }

    override fun onBindViewHolder(holder: FileViewHolder, position: Int) {
        val file = files[position]
        holder.bind(file)
        
        holder.itemView.setOnClickListener {
            val context = holder.itemView.context
            
            val baseUrl = com.secretaryapp.api.RetrofitClient.getBaseUrl()
            // Asegurarse de que no haya doble barra
            val normalizedFileUrl = if (file.file_url.startsWith("/")) file.file_url else "/${file.file_url}"
            val finalUrl = "$baseUrl$normalizedFileUrl"
            
            android.util.Log.d("PatientFileAdapter", "Opening URL: $finalUrl")
            
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(finalUrl))
            context.startActivity(intent)
        }
    }

    override fun getItemCount() = files.size

    fun updateList(newList: List<PatientFile>) {
        files = newList
        notifyDataSetChanged()
    }
}
