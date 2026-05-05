# appointmentListeners.js

- **Tipo:** code
- **Archivo:** server/listeners/appointmentListeners.js
- **Estado:** Activo (Registra oyentes de eventos globales)

## 🔗 Conexiones Reales (Detectadas por Gemini)

### 📥 Escucha Eventos de:
- [[appointmentEvents.js]] --> Escucha `appointmentCreated` y `appointmentStatusUpdated`.

### 📤 Llama a:
- [[googleSyncService.js]] --> Para sincronizar citas con Google Calendar.
- [[doctorRepository.js]] --> Para obtener la duración del turno (Añadido recientemente).
- [[audit.js]] --> Para registrar acciones en el log de auditoría.

## 📝 Responsabilidades
1. **Sincronización:** Asegura que cada vez que se crea un turno en la App, aparezca en Google Calendar.
2. **Auditoría:** Registra en la consola/base de datos quién creó el turno y a qué paciente pertenece.
3. **Mantenimiento:** Gestiona la eliminación de eventos en Google si un turno es sobrescrito.

---
*Nota: Esta conexión fue verificada manualmente por Gemini CLI ante la falta de enlaces automáticos en el grafo estático.*
