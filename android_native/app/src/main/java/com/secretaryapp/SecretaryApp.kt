package com.secretaryapp

import android.app.Application
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager

class SecretaryApp : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Initialize RetrofitClient with application context
        RetrofitClient.initialize(applicationContext)
    }
}
