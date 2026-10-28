-- Seed templates for WhatsApp pending booking approvals and alternative slots
INSERT INTO system_settings (setting_key, setting_value, updated_at) VALUES
('whatsapp_template_accept', '✅ *TURNO CONFIRMADO* - {patient_name}\n\n📅 *Día:* {date}\n⏰ *Hora:* {time}\n👩‍⚕️ *Dr/a:* {doctor_name}\n\n¡Te esperamos en el consultorio! 🏥', NOW()),
('whatsapp_template_alternative', 'Hola {patient_name}! 👋 Para el horario pedido no tenemos disponibilidad. Te ofrecemos este turno alternativo:\n\n📅 *Día:* {date}\n⏰ *Hora:* {time}\n👩‍⚕️ *Dr/a:* {doctor_name}\n\n¿Nos confirmas si te queda bien? Muchas gracias!', NOW())
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW();
