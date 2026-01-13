package com.secretaryapp.model

data class Message(
    val id: Int,
    val sender_id: Int,
    val recipient_id: Int?,
    val recipient_type: String, // 'individual', 'all_staff', 'all_patients'
    val subject: String?,
    val message: String,
    val read_status: Int,
    val delivered_at: String?,
    val read_at: String?,
    val created_at: String,
    val sender_name: String?,
    val recipient_name: String?,
    // Thread/Conversation fields
    val other_user_id: Int?,
    val other_display_name: String?,
    val unread_count: Int? = 0
)

data class TypingStatus(
    val is_typing: Boolean
)

data class TypingRequest(
    val target_id: Int
)

data class SendMessageRequest(
    val recipient_id: Int?,
    val recipient_type: String,
    val subject: String?,
    val message: String
)

data class MessageResponse(
    val id: Int?,
    val message: String
)

data class UnreadCountResponse(
    val unread_count: Int
)

data class Recipient(
    val id: Int,
    val username: String,
    val role: String,
    val display_name: String
)
