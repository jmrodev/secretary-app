package com.secretaryapp.api

import android.content.Context
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val DEFAULT_IP = "10.0.2.2" // Emulator default host
    private const val DEFAULT_PORT = "5000"
    private const val DEFAULT_BASE_URL = "http://$DEFAULT_IP:$DEFAULT_PORT/api/"
    
    private var currentBaseUrl: String = DEFAULT_BASE_URL
    private var retrofit: Retrofit? = null
    private var context: Context? = null

    fun initialize(appContext: Context) {
        context = appContext
        loadBaseUrlFromPreferences()
    }

    private fun loadBaseUrlFromPreferences() {
        context?.let {
            val sharedPreferences = it.getSharedPreferences("ServerConfig", Context.MODE_PRIVATE)
            val savedIp = sharedPreferences.getString("server_ip", DEFAULT_IP)
            val savedPort = sharedPreferences.getString("server_port", DEFAULT_PORT)
            
            val protocol = if (savedPort == "443") "https" else "http"
            val portSuffix = if (savedPort == "443" || savedPort == "80") "" else ":$savedPort"
            currentBaseUrl = "$protocol://$savedIp$portSuffix/api/"
        }
    }

    fun getBaseUrl(): String {
        return currentBaseUrl.replace("/api/", "")
    }

    fun updateBaseUrl(newBaseUrl: String) {
        currentBaseUrl = newBaseUrl
        retrofit = null 
    }

    val instance: ApiService
        get() {
            if (retrofit == null) {
                retrofit = Retrofit.Builder()
                    .baseUrl(currentBaseUrl)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()
            }
            return retrofit!!.create(ApiService::class.java)
        }
}
