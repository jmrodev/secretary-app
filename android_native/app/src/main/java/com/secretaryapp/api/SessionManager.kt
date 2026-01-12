package com.secretaryapp.api

object SessionManager {
    private var rawToken: String? = null
    var username: String? = null
    var userId: Int = 0
    var role: String? = null
    
    private var prefs: android.content.SharedPreferences? = null

    fun init(context: android.content.Context) {
        prefs = context.getSharedPreferences("AppSession", android.content.Context.MODE_PRIVATE)
        rawToken = prefs?.getString("token", null)
        username = prefs?.getString("username", null)
        userId = prefs?.getInt("user_id", 0) ?: 0
        role = prefs?.getString("role", null)
    }

    // Propiedad que retorna el token con Bearer automáticamente
    val authToken: String?
        get() = rawToken?.let { "Bearer $it" }
    
    // Mantener compatibilidad con código existente
    @Deprecated("Use authToken instead", ReplaceWith("authToken"))
    val token: String?
        get() = rawToken

    fun saveSession(token: String, userId: Int, username: String, role: String) {
        this.rawToken = token
        this.userId = userId
        this.username = username
        this.role = role
        
        prefs?.edit()?.apply {
            putString("token", token)
            putInt("user_id", userId)
            putString("username", username)
            putString("role", role)
            apply()
        }
    }

    fun clear() {
        rawToken = null
        username = null
        userId = 0
        role = null
        
        prefs?.edit()?.clear()?.apply()
    }

    fun isLoggedIn(): Boolean = rawToken != null
}
