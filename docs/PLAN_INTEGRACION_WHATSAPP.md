# Plan de Integración: WhatsApp Local Bridge

Este documento detalla la estrategia técnica para integrar el puente de WhatsApp local (basado en MCP/Go) con **Secretary App**, permitiendo el envío automático de mensajes sin depender de Meta Cloud API.

## 1. Estado Actual
- La aplicación copia texto al portapapeles para uso manual en ZapZap/WhatsApp Web.
- Existe una estructura para Meta Cloud API (inactiva por falta de credenciales).

## 2. Componentes de la Integración

### A. El Puente (Ya configurado)
- **Servicio:** `whatsapp-bridge.service` (systemd).
- **Endpoint:** `POST http://localhost:8080/api/send`
- **Payload:** `{"recipient": "549...", "message": "Texto"}`

### B. Backend (Node.js)
Se requiere actualizar `server/services/whatsappService.js` para soportar el envío directo.

```javascript
// Ejemplo de la nueva lógica de envío directo
const sendMessageDirect = async (to, message) => {
    return await axios.post('http://localhost:8080/api/send', {
        recipient: to,
        message: message
    });
};
```

### C. Ajustes de Sistema
Se recomienda añadir una opción en la base de datos:
- `setting_key`: `whatsapp_use_local_bridge`
- `setting_value`: `true` / `false`

## 3. Hoja de Ruta de Implementación

1. **Fase 1: Endpoint de Envío Directo**
   - Crear `POST /api/whatsapp/send-direct` en el backend.
   - Este endpoint recibirá el número y el mensaje ya armado por el frontend.

2. **Fase 2: Actualización de Hooks en Frontend**
   - Modificar `client/src/features/appointments/hooks/useWhatsAppUniversal.js`.
   - En lugar de disparar directamente `copyToClipboard`, realizar una llamada a la API de la app.
   - **Lógica de Fallback:**
     ```javascript
     try {
         await api.post('/whatsapp/send-direct', { to, message });
         toast.success("Mensaje enviado automáticamente");
     } catch (err) {
         await copyToClipboard(message);
         toast.info("Puente local no disponible. Copiado al portapapeles.");
     }
     ```

3. **Fase 3: Automatización de Recordatorios**
   - Vincular `reminderService.js` con el nuevo envío directo para que los recordatorios de turnos se envíen de madrugada de forma desatendida.

## 4. Ventajas
- **Cero Costo:** No se paga por mensaje ni por plantillas.
- **Sin Restricciones:** Se puede enviar cualquier texto (links, recordatorios personalizados).
- **Privacidad:** Los datos no pasan por servidores de terceros, solo por tu puente local.
