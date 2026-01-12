package com.secretaryapp.utils

object RatingUtils {
    fun calculateFinancialRating(debt: Double): Int {
        return when {
            debt <= 0 -> 5
            debt < 1000 -> 4
            debt < 5000 -> 3
            debt < 10000 -> 2
            else -> 1
        }
    }

    fun calculateAttendanceRating(total: Int, missed: Int): Int {
        if (total == 0) return 5
        val ratio = (total - missed).toDouble() / total
        return when {
            ratio >= 0.95 -> 5
            ratio >= 0.85 -> 4
            ratio >= 0.70 -> 3
            ratio >= 0.50 -> 2
            else -> 1
        }
    }

    fun getStarString(rating: Int): String {
        val stars = StringBuilder()
        for (i in 1..5) {
            stars.append(if (i <= rating) "★" else "☆")
        }
        return stars.toString()
    }
}
