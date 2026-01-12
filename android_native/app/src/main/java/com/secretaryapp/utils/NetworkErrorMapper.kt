package com.secretaryapp.utils

import android.content.Context
import com.secretaryapp.R
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object NetworkErrorMapper {
    fun getUserFriendlyMessage(throwable: Throwable, context: Context): String {
        return when (throwable) {
            is SocketTimeoutException -> {
                context.getString(R.string.error_connection_timeout)
            }
            is ConnectException -> {
                context.getString(R.string.error_connection_failed)
            }
            is UnknownHostException -> {
                // This usually happens when DNS fails or server is completely unreachable (including no internet)
                context.getString(R.string.error_connection_failed)
            }
            else -> {
                throwable.message ?: context.getString(R.string.error_unknown)
            }
        }
    }
}
