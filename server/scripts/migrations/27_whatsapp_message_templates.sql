INSERT INTO system_settings (key, value, description) VALUES
('whatsapp_template_reminder', 'Hola {patient_name}, te recordamos tu cita el {date} a las {time} con {doctor_name} en {appointment_location}. 🏥', 'Plantilla para recordatorio de citas'),
('whatsapp_template_confirmation', 'Hola {patient_name}, tu cita el {date} a las {time} con {doctor_name} ha sido confirmada. ✅', 'Plantilla para confirmación de citas'),
('whatsapp_template_debt', 'Hola {patient_name}, tienes un saldo pendiente de {debt_amount}. Por favor, regulariza tu situación a la brevedad. 💸', 'Plantilla para recordatorio de deuda'),
('whatsapp_template_accept', 'Hola {patient_name}, tu solicitud de cita para el {date} a las {time} con {doctor_name} ha sido aceptada. 🎉', 'Plantilla para aceptar cita pendiente'),
('whatsapp_template_alternative', 'Hola {patient_name}, no tenemos disponibilidad el {date} a las {time}. ¿Te gustaría reprogramar? 🗓️', 'Plantilla para sugerir horario alternativo');
