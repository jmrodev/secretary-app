package com.secretaryapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.R
import com.secretaryapp.model.Message
import java.text.SimpleDateFormat
import java.util.*

class MessageAdapter(
    private val messages: List<Message>,
    private val onItemClick: (Message) -> Unit
) : RecyclerView.Adapter<MessageAdapter.MessageViewHolder>() {

    class MessageViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvFrom: TextView = view.findViewById(R.id.tvFrom)
        val tvDate: TextView = view.findViewById(R.id.tvDate)
        val tvSubject: TextView = view.findViewById(R.id.tvSubject)
        val tvPreview: TextView = view.findViewById(R.id.tvPreview)
        val tvUnreadBadge: TextView = view.findViewById(R.id.tvUnreadBadge)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MessageViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_message, parent, false)
        return MessageViewHolder(view)
    }

    override fun onBindViewHolder(holder: MessageViewHolder, position: Int) {
        val message = messages[position]

        // Threaded view logic
        val displayName = message.other_display_name ?: message.sender_name ?: "Desconocido"
        holder.tvFrom.text = displayName
        holder.tvDate.text = if (message.created_at.isNotEmpty()) formatDate(message.created_at) else ""
        
        // Subject is usually not visible in chat list unless it's a broadcast
        if (message.recipient_type == "all_staff") {
            holder.tvSubject.visibility = View.VISIBLE
            holder.tvSubject.text = "TODO EL STAFF: ${message.subject ?: ""}"
        } else {
            holder.tvSubject.visibility = View.GONE
        }

        holder.tvPreview.text = message.message.take(100) + if (message.message.length > 100) "..." else ""

        val count = message.unread_count ?: 0
        if (count > 0) {
            holder.tvUnreadBadge.visibility = View.VISIBLE
            holder.tvUnreadBadge.text = if (count > 99) "99+" else count.toString()
            holder.itemView.setBackgroundColor(holder.itemView.context.getColor(R.color.unread_bg))
        } else {
            holder.tvUnreadBadge.visibility = View.GONE
            holder.itemView.setBackgroundColor(holder.itemView.context.getColor(android.R.color.white))
        }

        holder.itemView.setOnClickListener {
            onItemClick(message)
        }
    }

    override fun getItemCount() = messages.size

    private fun formatDate(dateString: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            val date = inputFormat.parse(dateString)
            
            val now = Calendar.getInstance()
            val msgDate = Calendar.getInstance()
            date?.let { msgDate.time = it }
            
            val outputFormat = if (now.get(Calendar.DATE) == msgDate.get(Calendar.DATE)) {
                SimpleDateFormat("HH:mm", Locale.getDefault())
            } else {
                SimpleDateFormat("dd/MM", Locale.getDefault())
            }
            
            date?.let { outputFormat.format(it) } ?: dateString
        } catch (e: Exception) {
            dateString
        }
    }
}
