export const whatsapp_automation = {
    // WhatsApp Automation
    whatsapp_automation_title: "Automatización de WhatsApp (IA)",
    whatsapp_auto_respond_unknown_label: "Responder automáticamente a números desconocidos",
    whatsapp_auto_respond_unknown_hint: "Si está activado, la IA enviará automáticamente un saludo y el link de registro a cualquier número que no esté en tu agenda.",

    // WhatsApp Page Config
    wa_config_doctor: "Médico",
    wa_config_prompt_label: "Prompt / Contexto de la IA",
    wa_config_prompt_hint: "Este texto define cómo se comporta la IA al responder pacientes.",
    wa_config_prompt_restore: "Restaurar base",
    wa_config_model_label: "Configuración del modelo",
    wa_config_model: "Modelo",
    wa_config_history: "Historial (mensajes)",
    wa_config_quick_label: "Respuestas rápidas",
    wa_config_quick_hint: "Tocá una respuesta para copiarla al clipboard y usarla en el chat.",
    wa_config_save: "Guardar configuración",
    wa_config_saved: "Configuración guardada ✅",
    wa_config_error: "Error al guardar ❌",
    wa_config_connection_error: "Error de conexión al guardar ❌",
    wa_config_copied: "Copiado al clipboard 📋",

    // Quick responses
    wa_qr_saludo: "Saludo inicial",
    wa_qr_saludo_text: "¡Hola {patient_name}! 👋 Soy {secretary_name} de Cima Salud. ¿En qué puedo ayudarte hoy?",
    wa_qr_confirmar: "Confirmar turno",
    wa_qr_confirmar_text: "Te confirmamos tu turno con {doctor_name} para el {date} a las {time} hs en {appointment_location}. ¡Te esperamos! 🏥",
    wa_qr_recordatorio: "Recordatorio turno",
    wa_qr_recordatorio_text: "Hola {patient_name}, te recordamos tu turno con {doctor_name} el {date} a las {time} hs en {appointment_location}. ¡Te esperamos! 😊",
    wa_qr_reprogramar: "Reprogramar turno",
    wa_qr_reprogramar_text: "No hay problema, consulto con la secretaría y te confirmamos un nuevo horario. ¿Qué días y horarios te vienen bien? 📅",
    wa_qr_precio: "Consultar precio",
    wa_qr_precio_text: "El valor de la consulta con {doctor_name} es de {price}. Consultorio: {appointment_location}. ¿Querés que te agende un turno? 💰",
    wa_qr_derivar: "Derivar a secretaría",
    wa_qr_derivar_text: "Consulto con la secretaría y te confirmamos a la brevedad. 🙋‍♀️",

    // Copy button
    wa_copy_btn: "Copiar",

    // Pending approvals queue (supervised auto-booking)
    pending_approval_title: "Aprobaciones pendientes",
    pending_approval_banner_one: "{count} aprobación pendiente",
    pending_approval_banner_many: "{count} aprobaciones pendientes",
    pending_approval_open: "Abrir aprobaciones pendientes",
    pending_approval_close: "Cerrar aprobaciones pendientes",
    pending_approval_empty: "No hay aprobaciones pendientes",
    pending_approval_accept: "Aceptar",
    pending_approval_suggest: "Sugerir alternativa",
    pending_approval_reject: "Rechazar",
    pending_approval_status_alternative: "Esperando respuesta del paciente",
    pending_approval_accept_success: "Turno aprobado y confirmado ✅",
    pending_approval_accept_error: "Error al aprobar el turno",
    pending_approval_accept_taken: "Ya fue aprobado por otra persona",
    pending_approval_accept_slot_taken: "El turno ya no está disponible",
    pending_approval_accept_phone_changed: "El paciente cambió su número. El pedido fue rechazado.",
    pending_approval_suggest_success: "Alternativa enviada al paciente",
    pending_approval_suggest_error: "Error al enviar la alternativa",
    pending_approval_reject_success: "Pedido rechazado",
    pending_approval_reject_error: "Error al rechazar el pedido",
    pending_approval_loading: "Cargando aprobaciones...",

    // Pending-state AI response template
    wa_config_pending_template_label: "Plantilla de respuesta en estado pendiente",
    wa_config_pending_template_hint: "Mensaje que envía la IA cuando el paciente escribe mientras su turno espera aprobación.",
    wa_config_pending_template_placeholder: "Ej: Tu solicitud está en revisión, te confirmamos a la brevedad.",
};