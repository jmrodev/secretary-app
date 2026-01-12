package com.secretaryapp.api

object SessionManager {
    private var rawToken: String? = null
    var username: String? = null
    var userId: Int = 0
    var role: String? = null

    // Propiedad que retorna el token con Bearer automáticamente
    val authToken: String?
        get() = rawToken?.let { "Bearer $it" }
    
    // Mantener compatibilidad con código existente
    @Deprecated("Use authToken instead", ReplaceWith("authToken"))
    val token: String?
        get() = rawToken

    fun saveSession(token: String, userId: Int, username: String, role: String) {
        this.rawToken = token  // Guardar token sin prefijo
        this.userId = userId
        this.username = username
        this.role = role
    }

    fun clear() {
        rawToken = null
        username = null
        userId = 0
        role = null
    }

    fun isLoggedIn(): Boolean = rawToken != null
}
