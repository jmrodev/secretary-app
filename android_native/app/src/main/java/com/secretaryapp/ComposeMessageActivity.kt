package com.secretaryapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.appcompat.app.AlertDialog
import android.util.Log
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.model.Recipient
import com.secretaryapp.model.SendMessageRequest
import kotlinx.coroutines.launch

class ComposeMessageActivity : AppCompatActivity() {
    private lateinit var spinnerRecipientType: Spinner
    private lateinit var spinnerRecipient: Spinner
    private lateinit var layoutIndividual: LinearLayout
    private lateinit var layoutBroadcast: LinearLayout
    private lateinit var etSubject: EditText
    private lateinit var etMessage: EditText
    private lateinit var btnSendBroadcast: Button
    private lateinit var btnStartChat: Button
    private lateinit var btnCancel: Button

    private val recipients = mutableListOf<Recipient>()
    private var selectedRecipient: Recipient? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_compose_message)

        spinnerRecipientType = findViewById(R.id.spinnerRecipientType)
        spinnerRecipient = findViewById(R.id.spinnerRecipient)
        layoutIndividual = findViewById(R.id.layoutIndividual)
        layoutBroadcast = findViewById(R.id.layoutBroadcast)
        etSubject = findViewById(R.id.etSubject)
        etMessage = findViewById(R.id.etMessage)
        btnSendBroadcast = findViewById(R.id.btnSend)
        btnStartChat = findViewById(R.id.btnStartChat)
        btnCancel = findViewById(R.id.btnCancel)

        setupRecipientTypeSpinner()
        loadRecipients()
        setupListeners()
    }

    private fun setupRecipientTypeSpinner() {
        val types = arrayOf("Individual (Chat)", "Todo el Staff (Comunicado)")
        val adapter = ArrayAdapter(this, android.R.layout.simple_spinner_item, types)
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinnerRecipientType.adapter = adapter

        spinnerRecipientType.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                if (position == 0) {
                    layoutIndividual.visibility = View.VISIBLE
                    layoutBroadcast.visibility = View.GONE
                } else {
                    layoutIndividual.visibility = View.GONE
                    layoutBroadcast.visibility = View.VISIBLE
                }
            }
            override fun onNothingSelected(parent: AdapterView<*>?) {}
        }
    }

    private fun loadRecipients() {
        val token = SessionManager.authToken ?: ""
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.instance.getRecipients(token)
                if (response.isSuccessful) {
                    recipients.clear()
                    response.body()?.let { recipients.addAll(it) }

                    val names = recipients.map { "${it.display_name} (${it.role})" }
                    val adapter = ArrayAdapter(this@ComposeMessageActivity, android.R.layout.simple_spinner_item, names)
                    adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                    spinnerRecipient.adapter = adapter

                    spinnerRecipient.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                        override fun onItemSelected(parent: AdapterView<*>?, view: View?, position: Int, id: Long) {
                            selectedRecipient = recipients[position]
                        }
                        override fun onNothingSelected(parent: AdapterView<*>?) {}
                    }
                }
            } catch (e: Exception) {
                Log.e("Compose", "Error loading recipients", e)
            }
        }
    }

    private fun setupListeners() {
        btnCancel.setOnClickListener { finish() }

        btnStartChat.setOnClickListener {
            selectedRecipient?.let {
                val intent = Intent(this, MessageDetailActivity::class.java)
                intent.putExtra("other_user_id", it.id)
                intent.putExtra("other_display_name", it.display_name)
                startActivity(intent)
                finish()
            }
        }

        btnSendBroadcast.setOnClickListener {
            sendBroadcast()
        }
    }

    private fun sendBroadcast() {
        val message = etMessage.text.toString().trim()
        val subject = etSubject.text.toString().trim()
        
        if (message.isEmpty()) {
            Toast.makeText(this, "El mensaje no puede estar vacío", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            try {
                val token = SessionManager.authToken ?: ""
                val request = SendMessageRequest(
                    recipient_id = null,
                    recipient_type = "all_staff",
                    subject = subject.ifEmpty { null },
                    message = message
                )
                val response = RetrofitClient.instance.sendMessage(token, request)
                if (response.isSuccessful) {
                    Toast.makeText(this@ComposeMessageActivity, "Comunicado enviado", Toast.LENGTH_SHORT).show()
                    finish()
                }
            } catch (e: Exception) {
                Toast.makeText(this@ComposeMessageActivity, "Error al enviar", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
