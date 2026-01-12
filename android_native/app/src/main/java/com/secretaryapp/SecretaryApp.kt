package com.secretaryapp

import android.app.Application
import com.secretaryapp.api.RetrofitClient
import com.secretaryapp.api.SessionManager

class SecretaryApp : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // Initialize RetrofitClient and SessionManager with application context
        RetrofitClient.initialize(applicationContext)
        SessionManager.init(applicationContext)
    }
}
