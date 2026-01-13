package com.secretaryapp

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import android.content.ClipboardManager
import android.content.ClipData
import android.content.Context
import android.content.DialogInterface
import androidx.appcompat.widget.SearchView
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Message
import com.secretaryapp.ui.MessageAdapter
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class MessagesActivity : AppCompatActivity() {
    private lateinit var recyclerMessages: RecyclerView
    private lateinit var searchMessages: SearchView
    private lateinit var tvEmptyState: TextView
    
    private val allMessages = mutableListOf<Message>()
    private val allRecipients = mutableListOf<com.secretaryapp.model.Recipient>()
    private val displayItems = mutableListOf<Message>()
    
    private lateinit var adapter: MessageAdapter
    private var loadJob: Job? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_messages)

        recyclerMessages = findViewById(R.id.recyclerMessages)
        tvEmptyState = findViewById(R.id.tvEmptyState)
        searchMessages = findViewById(R.id.searchMessages)

        setupRecyclerView()
        setupListeners()
    }

    private fun setupRecyclerView() {
        adapter = MessageAdapter(displayItems) { message ->
            openChatThread(message)
        }
        recyclerMessages.layoutManager = LinearLayoutManager(this)
        recyclerMessages.adapter = adapter
    }

    private fun setupListeners() {
        searchMessages.setOnQueryTextListener(object : SearchView.OnQueryTextListener {
            override fun onQueryTextSubmit(query: String?): Boolean {
                filterItems(query)
                return true
            }

            override fun onQueryTextChange(newText: String?): Boolean {
                filterItems(newText)
                return true
            }
        })
    }

    private fun filterItems(query: String?) {
        displayItems.clear()
        val q = query?.lowercase()?.trim() ?: ""
        
        // Filter existing conversations
        val filteredMessages = if (q.isEmpty()) {
            allMessages
        } else {
            allMessages.filter {
                it.other_display_name?.lowercase()?.contains(q) == true ||
                it.message.lowercase().contains(q)
            }
        }
        displayItems.addAll(filteredMessages)

        // Show staff members (recipients) that match the query or show all staff if query is empty
        // We filter out users who already have a conversation in the list above to avoid duplicates
        val existingChatUserIds = filteredMessages.mapNotNull { it.other_user_id }.toSet()
        val filteredRecipients = allRecipients.filter {
            (q.isEmpty() || it.display_name.lowercase().contains(q) || it.role.lowercase().contains(q)) && 
            !existingChatUserIds.contains(it.id)
        }

        filteredRecipients.forEach {
            displayItems.add(Message(
                id = 0,
                sender_id = SessionManager.userId,
                recipient_id = it.id,
                recipient_type = "individual",
                subject = null,
                message = "Toca para iniciar un chat (${it.role})",
                read_status = 1,
                delivered_at = null,
                read_at = null,
                created_at = "", // Placeholder
                sender_name = null,
                recipient_name = it.display_name,
                other_user_id = it.id,
                other_display_name = it.display_name,
                unread_count = 0
            ))
        }
        
        adapter.notifyDataSetChanged()
        updateEmptyState()
    }

    private fun updateEmptyState() {
        if (displayItems.isEmpty()) {
            tvEmptyState.text = "No se encontraron resultados"
            tvEmptyState.visibility = View.VISIBLE
            recyclerMessages.visibility = View.GONE
        } else {
            tvEmptyState.visibility = View.GONE
            recyclerMessages.visibility = View.VISIBLE
        }
    }

    private fun loadConversations() {
        loadJob?.cancel()
        loadJob = lifecycleScope.launch {
            try {
                val token = SessionManager.token ?: ""
                val response = RetrofitClient.instance.getConversations("Bearer $token")
                val recipientsResponse = RetrofitClient.instance.getRecipients("Bearer $token")

                if (response.isSuccessful) {
                    allMessages.clear()
                    response.body()?.let { allMessages.addAll(it) }
                    
                    if (recipientsResponse.isSuccessful) {
                        allRecipients.clear()
                        recipientsResponse.body()?.let { allRecipients.addAll(it) }
                    }

                    filterItems(searchMessages.query.toString())
                } else {
                    showErrorDialog("Error", "No se pudieron cargar las conversaciones: ${response.code()}")
                }
            } catch (ce: CancellationException) {
                // Ignore
            } catch (e: Exception) {
                if (!isFinishing) {
                    val msg = e.message ?: "Error desconocido"
                    if (!msg.contains("cancelled", ignoreCase = true)) {
                        showErrorDialog("Error de Conexión", msg)
                    }
                }
            }
        }
    }

    private fun openChatThread(message: Message) {
        val intent = Intent(this, MessageDetailActivity::class.java)
        // If it's a staff broadcast, we show traditional detail
        if (message.recipient_type == "all_staff") {
            intent.putExtra("message_id", message.id)
            intent.putExtra("is_broadcast", true)
        } else {
            // It's a personal conversation
            intent.putExtra("other_user_id", message.other_user_id)
            intent.putExtra("other_display_name", message.other_display_name)
        }
        startActivity(intent)
    }

    private fun showErrorDialog(title: String, message: String) {
        if (isFinishing) return
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Cerrar", null)
            .setNeutralButton("Copiar") { dialog: DialogInterface, which: Int ->
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("Error Detail", message)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(this@MessagesActivity, "Copiado al portapapeles", Toast.LENGTH_SHORT).show()
            }
            .show()
    }

    override fun onResume() {
        super.onResume()
        loadConversations()
    }
}
