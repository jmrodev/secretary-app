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

import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanIntentResult
import com.journeyapps.barcodescanner.ScanOptions

class SettingsActivity : AppCompatActivity() {

    private lateinit var etServerIp: EditText
    private lateinit var etServerPort: EditText
    private lateinit var btnTestConnection: Button
    private lateinit var btnScanQr: Button
    private lateinit var btnSave: Button

    private val barcodeLauncher = registerForActivityResult(ScanContract()) { result: ScanIntentResult ->
        if (result.contents != null) {
            parseScannedUrl(result.contents)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        etServerIp = findViewById(R.id.etServerIp)
        etServerPort = findViewById(R.id.etServerPort)
        btnTestConnection = findViewById(R.id.btnTestConnection)
        btnScanQr = findViewById(R.id.btnScanQr)
        btnSave = findViewById(R.id.btnSave)

        // Load saved configuration
        loadConfiguration()

        btnScanQr.setOnClickListener {
            val options = ScanOptions()
            options.setPrompt("Escanee el QR del Dashboard (Fondo Gris)")
            options.setBeepEnabled(true)
            options.setOrientationLocked(false)
            barcodeLauncher.launch(options)
        }

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

        val protocol = if (port == "443") "https" else "http"
        val portSuffix = if (port == "443" || port == "80") "" else ":$port"
        val testUrl = "$protocol://$ip$portSuffix/api/"
        
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

        // Update RetrofitClient using protocol-aware logic
        val protocol = if (port == "443") "https" else "http"
        val portSuffix = if (port == "443" || port == "80") "" else ":$port"
        val baseUrl = "$protocol://$ip$portSuffix/api/"
        RetrofitClient.updateBaseUrl(baseUrl)

        Toast.makeText(this, "Configuración guardada", Toast.LENGTH_SHORT).show()
        
        // Return to previous activity
        finish()
    }

    private fun parseScannedUrl(contents: String) {
        try {
            // contents could be "http://192.168.0.98:5173" or just "192.168.0.98"
            val cleanUrl = if (contents.startsWith("http")) contents else "http://$contents"
            val uri = java.net.URI(cleanUrl)
            val host = uri.host
            var port = uri.port

            if (host != null) {
                etServerIp.setText(host)
                // If scanned from Dashboard (Vite), it's 5173. But API is 5000.
                // If it's a Cloudflare URL, port is -1 and it's https (443)
                if (cleanUrl.contains(".trycloudflare.com")) {
                    port = 443
                } else if (port == 5173 || port == -1) {
                    port = 5000
                }
                etServerPort.setText(port.toString())
                Toast.makeText(this, "Conexión detectada: $host:$port", Toast.LENGTH_SHORT).show()
                
                // Optional: Auto-test connection
                testConnection()
            }
        } catch (e: Exception) {
            Toast.makeText(this, "Error al leer el QR: ${e.message}", Toast.LENGTH_LONG).show()
        }
    }
}
