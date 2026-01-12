package com.secretaryapp

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.secretaryapp.api.RetrofitClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import com.secretaryapp.utils.NetworkErrorMapper

class SettingsActivity : AppCompatActivity() {

    private lateinit var etServerIp: EditText
    private lateinit var etServerPort: EditText
    private lateinit var btnTestConnection: Button
    private lateinit var btnSave: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        etServerIp = findViewById(R.id.etServerIp)
        etServerPort = findViewById(R.id.etServerPort)
        btnTestConnection = findViewById(R.id.btnTestConnection)
        btnSave = findViewById(R.id.btnSave)

        // Load saved configuration
        loadConfiguration()

        btnTestConnection.setOnClickListener {
            testConnection()
        }

        btnSave.setOnClickListener {
            saveConfiguration()
        }
    }

    private fun loadConfiguration() {
        val sharedPreferences = getSharedPreferences("ServerConfig", Context.MODE_PRIVATE)
        val savedIp = sharedPreferences.getString("server_ip", "10.0.2.2")
        val savedPort = sharedPreferences.getString("server_port", "5000")
        
        etServerIp.setText(savedIp)
        etServerPort.setText(savedPort)
    }

    private fun testConnection() {
        val ip = etServerIp.text.toString()
        val port = etServerPort.text.toString()

        if (ip.isEmpty() || port.isEmpty()) {
            Toast.makeText(this, "Por favor ingrese IP y puerto", Toast.LENGTH_SHORT).show()
            return
        }

        val testUrl = "http://$ip:$port/api/"
        
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Update RetrofitClient with test URL
                RetrofitClient.updateBaseUrl(testUrl)
                
                // Try to make a simple request (you can create a health check endpoint)
                val response = RetrofitClient.instance.login(
                    com.secretaryapp.api.LoginRequest("test", "test")
                )
                
                withContext(Dispatchers.Main) {
                    // Even if login fails, if we get a response, the server is reachable
                    Toast.makeText(
                        this@SettingsActivity,
                        "✓ Servidor encontrado en $testUrl",
                        Toast.LENGTH_LONG
                    ).show()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@SettingsActivity)
                    Toast.makeText(
                        this@SettingsActivity,
                        "✗ $errorMessage",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
    }

    private fun saveConfiguration() {
        val ip = etServerIp.text.toString()
        val port = etServerPort.text.toString()

        if (ip.isEmpty() || port.isEmpty()) {
            Toast.makeText(this, "Por favor ingrese IP y puerto", Toast.LENGTH_SHORT).show()
            return
        }

        val sharedPreferences = getSharedPreferences("ServerConfig", Context.MODE_PRIVATE)
        val editor = sharedPreferences.edit()
        editor.putString("server_ip", ip)
        editor.putString("server_port", port)
        editor.apply()

        // Update RetrofitClient
        val baseUrl = "http://$ip:$port/api/"
        RetrofitClient.updateBaseUrl(baseUrl)

        Toast.makeText(this, "Configuración guardada", Toast.LENGTH_SHORT).show()
        
        // Return to previous activity
        finish()
    }
}
