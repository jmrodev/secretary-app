package com.secretaryapp

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.DialogInterface
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.secretaryapp.api.LoginRequest
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager
import com.secretaryapp.utils.NetworkErrorMapper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val etUsername = findViewById<EditText>(R.id.etUsername)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val btnSettings = findViewById<Button>(R.id.btnSettings)

        btnLogin.setOnClickListener {
            val username = etUsername.text.toString()
            val password = etPassword.text.toString()

            if (username.isNotEmpty() && password.isNotEmpty()) {
                login(username, password)
            } else {
                Toast.makeText(this, "Please enter username and password", Toast.LENGTH_SHORT).show()
            }
        }

        btnSettings.setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }
    }


    private fun login(username: String, password: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val response = RetrofitClient.instance.login(LoginRequest(username, password))
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        Toast.makeText(this@MainActivity, "Login Successful!", Toast.LENGTH_SHORT).show()
                        val loginData = response.body()
                        if (loginData != null) {
                            SessionManager.saveSession(
                                loginData.token,
                                loginData.user_id,
                                loginData.username,
                                loginData.role
                            )
                            startActivity(Intent(this@MainActivity, DashboardActivity::class.java))
                            finish()
                        }
                    } else {
                         Toast.makeText(this@MainActivity, "Login Failed: ${response.code()}", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    val errorMessage = NetworkErrorMapper.getUserFriendlyMessage(e, this@MainActivity)
                    showErrorDialog("Error de Conexión", errorMessage)
                }
            }
        }
    }

    private fun showErrorDialog(title: String, message: String) {
        AlertDialog.Builder(this)
            .setTitle(title)
            .setMessage(message)
            .setPositiveButton("Cerrar", null)
            .setNeutralButton("Copiar") { dialog: DialogInterface, which: Int ->
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                val clip = ClipData.newPlainText("Error Detail", message)
                clipboard.setPrimaryClip(clip)
                Toast.makeText(this@MainActivity, "Copiado al portapapeles", Toast.LENGTH_SHORT).show()
            }
            .show()
    }
}
