package com.secretaryapp

import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import android.content.ClipboardManager
import android.content.ClipData
import android.content.Context
import android.content.DialogInterface
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Message
import com.secretaryapp.model.SendMessageRequest
import com.secretaryapp.ui.ChatAdapter
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MessageDetailActivity : AppCompatActivity() {
    private lateinit var recyclerChat: RecyclerView
    private lateinit var etChatMessage: EditText
    private lateinit var btnSendChat: android.view.View
    private lateinit var btnBack: ImageButton
    private lateinit var tvChatTitle: TextView
    private lateinit var tvChatSubtitle: TextView
    
    private var otherUserId: Int = -1
    private var otherDisplayName: String? = null
    private val chatMessages = mutableListOf<Message>()
    private lateinit var adapter: ChatAdapter
    private var loadJob: Job? = null
    private var typingNotifyJob: Job? = null
    private var typingCheckJob: Job? = null
    private var isBroadcast: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_message_detail)

        // Bind views
        recyclerChat = findViewById(R.id.recyclerChat)
        etChatMessage = findViewById(R.id.etChatMessage)
        btnSendChat = findViewById(R.id.btnSendChat)
        btnBack = findViewById(R.id.btnBack)
        tvChatTitle = findViewById(R.id.tvChatTitle)
        tvChatSubtitle = findViewById(R.id.tvChatSubtitle)

        // Get extras
        otherUserId = intent.getIntExtra("other_user_id", -1)
        otherDisplayName = intent.getStringExtra("other_display_name")
        isBroadcast = intent.getBooleanExtra("is_broadcast", false)

        if (isBroadcast) {
            tvChatTitle.text = "Comunicado Staff"
            tvChatSubtitle.text = "Mensaje General"
            findViewById<View>(R.id.layoutInput).visibility = View.GONE
            loadSingleMessage(intent.getIntExtra("message_id", -1))
        } else {
            tvChatTitle.text = otherDisplayName ?: "Chat"
            tvChatSubtitle.text = "En línea"
            setupRecyclerView()
            setupListeners()
            startAutoRefresh()
            startTypingLogic()
        }

        btnBack.setOnClickListener { finish() }
    }

    private fun setupRecyclerView() {
        adapter = ChatAdapter(chatMessages)
        recyclerChat.layoutManager = LinearLayoutManager(this)
        recyclerChat.adapter = adapter
    }

    private fun setupListeners() {
        btnSendChat.setOnClickListener {
            val text = etChatMessage.text.toString().trim()
            if (text.isNotEmpty()) {
                sendMessage(text)
            }
        }

        etChatMessage.addTextChangedListener(object : android.text.TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                notifyTyping()
            }
            override fun afterTextChanged(s: android.text.Editable?) {}
        })
    }

    private fun notifyTyping() {
        typingNotifyJob?.cancel()
        typingNotifyJob = lifecycleScope.launch {
            try {
                val token = SessionManager.authToken ?: ""
                RetrofitClient.instance.notifyTyping(token, com.secretaryapp.model.TypingRequest(otherUserId))
                delay(3000) // Throttle typing notifications
            } catch (e: Exception) {
                // Ignore
            }
        }
    }

    private fun startTypingLogic() {
        typingCheckJob?.cancel()
        typingCheckJob = lifecycleScope.launch {
            while (true) {
                checkOtherTypingStatus()
                delay(4000)
            }
        }
    }

    private suspend fun checkOtherTypingStatus() {
        try {
            val token = SessionManager.authToken ?: ""
            val response = RetrofitClient.instance.getTypingStatus(token, otherUserId)
            if (response.isSuccessful && response.body()?.is_typing == true) {
                tvChatSubtitle.text = "Escribiendo..."
                tvChatSubtitle.setTextColor(android.graphics.Color.parseColor("#0EA5E9"))
            } else {
                tvChatSubtitle.text = "En línea"
                tvChatSubtitle.setTextColor(android.graphics.Color.parseColor("#64748B"))
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun startAutoRefresh() {
        loadJob?.cancel()
        loadJob = lifecycleScope.launch {
            while (true) {
                loadThread(silent = chatMessages.isNotEmpty())
                delay(5000) // Refresh every 5 seconds
            }
        }
    }

    private suspend fun loadThread(silent: Boolean) {
        try {
            val token = SessionManager.authToken ?: ""
            val response = RetrofitClient.instance.getThread(token, otherUserId)

            if (response.isSuccessful) {
                val newMessages = response.body() ?: emptyList()
                if (newMessages.size != chatMessages.size) {
                    val isNewIncoming = newMessages.size > chatMessages.size && 
                                       newMessages.lastOrNull()?.sender_id != SessionManager.userId
                    
                    chatMessages.clear()
                    chatMessages.addAll(newMessages)
                    adapter.notifyDataSetChanged()
                    scrollToBottom()

                    if (isNewIncoming) {
                        playNotificationSound()
                    }
                }
            } else if (!silent) {
                showErrorDialog("Error", "No se pudo cargar el chat: ${response.code()}")
            }
        } catch (ce: CancellationException) {
            // Ignore
        } catch (e: Exception) {
            if (!silent && !isFinishing) {
                val msg = e.message ?: "Error desconocido"
                if (!msg.contains("cancelled", ignoreCase = true)) {
                    showErrorDialog("Error de Conexión", msg)
                }
            }
        }
    }

    private fun loadSingleMessage(messageId: Int) {
        lifecycleScope.launch {
            try {
                val token = SessionManager.authToken ?: ""
                val response = RetrofitClient.instance.getMessage(token, messageId)
                if (response.isSuccessful) {
                    response.body()?.let {
                        chatMessages.clear()
                        chatMessages.add(it)
                        setupRecyclerView()
                    }
                }
            } catch (e: Exception) {
                if (!isFinishing && e !is CancellationException) {
                    showErrorDialog("Error", "No se pudo cargar el mensaje")
                }
            }
        }
    }

    private fun sendMessage(text: String) {
        val request = SendMessageRequest(
            recipient_id = otherUserId,
            recipient_type = "individual",
            subject = "Re: Chat",
            message = text
        )

        lifecycleScope.launch {
            try {
                val token = SessionManager.authToken ?: ""
                val response = RetrofitClient.instance.sendMessage(token, request)
                if (response.isSuccessful) {
                    etChatMessage.setText("")
                    loadThread(silent = true)
                } else {
                    Toast.makeText(this@MessageDetailActivity, "Error al enviar", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MessageDetailActivity, "Error de red", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun scrollToBottom() {
        if (chatMessages.isNotEmpty()) {
            recyclerChat.scrollToPosition(chatMessages.size - 1)
        }
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
                Toast.makeText(this@MessageDetailActivity, "Copiado al portapapeles", Toast.LENGTH_SHORT).show()
            }
            .show()
    }

    private fun playNotificationSound() {
        try {
            val notification = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
            val r = android.media.RingtoneManager.getRingtone(applicationContext, notification)
            r.play()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
