package com.secretaryapp.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.R
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Message
import java.text.SimpleDateFormat
import java.util.*

class ChatAdapter(
    private val messages: List<Message>
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val VIEW_TYPE_SENT = 1
        private const val VIEW_TYPE_RECEIVED = 2
    }

    class SentViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvMessage: TextView = view.findViewById(R.id.tvMessage)
        val tvTime: TextView = view.findViewById(R.id.tvTime)
    }

    class ReceivedViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvMessage: TextView = view.findViewById(R.id.tvMessage)
        val tvTime: TextView = view.findViewById(R.id.tvTime)
    }

    override fun getItemViewType(position: Int): Int {
        val message = messages[position]
        return if (message.sender_id == SessionManager.userId) VIEW_TYPE_SENT else VIEW_TYPE_RECEIVED
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == VIEW_TYPE_SENT) {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_chat_sent, parent, false)
            SentViewHolder(view)
        } else {
            val view = LayoutInflater.from(parent.context).inflate(R.layout.item_chat_received, parent, false)
            ReceivedViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val message = messages[position]
        val timeStr = formatTime(message.created_at)

        if (holder is SentViewHolder) {
            holder.tvMessage.text = message.message
            holder.tvTime.text = timeStr
            
            val ivStatus = holder.itemView.findViewById<android.widget.ImageView>(com.secretaryapp.R.id.ivStatus)
            when (message.read_status) {
                0 -> { // Sent
                    ivStatus.setImageResource(com.secretaryapp.R.drawable.ic_chat_tick)
                    ivStatus.setColorFilter(android.graphics.Color.parseColor("#E0F2FE"))
                }
                1 -> { // Delivered
                    ivStatus.setImageResource(com.secretaryapp.R.drawable.ic_chat_ticks)
                    ivStatus.setColorFilter(android.graphics.Color.parseColor("#E0F2FE"))
                }
                2 -> { // Read
                    ivStatus.setImageResource(com.secretaryapp.R.drawable.ic_chat_ticks)
                    ivStatus.setColorFilter(android.graphics.Color.parseColor("#38BDF8"))
                }
            }
        } else if (holder is ReceivedViewHolder) {
            holder.tvMessage.text = message.message
            holder.tvTime.text = timeStr
        }
    }

    override fun getItemCount() = messages.size

    private fun formatTime(dateString: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            inputFormat.timeZone = TimeZone.getTimeZone("UTC")
            val date = inputFormat.parse(dateString)
            val outputFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
            date?.let { outputFormat.format(it) } ?: ""
        } catch (e: Exception) {
            ""
        }
    }
}
