# ⚙️ Guía de Configuración General - Secretary App

Esta guía detalla cómo configurar los módulos principales del sistema desde el panel de **Configuración del Sistema**.

## 1. Configuración de Google Sync 🗓️
Permite sincronizar turnos con Google Calendar y pagos con Google Sheets.

*   **Habilitar Sincronización**: Interruptor general (On/Off).
*   **Vincular Cuenta**: Cada médico debe vincular su cuenta desde su perfil para tener su propio calendario.
*   **Planilla de Finanzas**:
    *   Puedes asignar una planilla ID global en la configuración general.
    *   **ID de Planilla**: Es el código largo en la URL de tu Google Sheet (ej: `1ShIiX...`).

## 2. Acceso Remoto (DuckDNS / Cloudflare) 🌐
Configura cómo se accede a la app desde fuera del consultorio.

*   **Método**: Puedes elegir entre `Cloudflare Tunnel` (más estable) o `DuckDNS` (mejor para apps nativas).
*   **DuckDNS**:
    *   **Dominio**: `tu-clinica.duckdns.org`
    *   **Token**: El token secreto que te da DuckDNS.
*   **Refrescar Túnel**: Si pierdes conexión, usa el botón "Refrescar" para generar una nueva URL o actualizar la IP.

## 3. Módulo de Finanzas 💰
Controla cómo se procesan los pagos y retiros.

*   **Habilitar CRUD para Secretarias**: (On/Off) Permite o prohíbe que las secretarias editen o eliminen transacciones ya registradas.
*   **Alquileres de Consultorio**:
    *   Si está activo, el sistema permite configurar cobros fijos mensuales o por turno a los médicos.
*   **Sincronización de Retiros**: Ahora los retiros se envían con signo negativo (`-`) a Google Sheets para que el balance sea automático.

## 4. Gestión de Usuarios y Perfiles 👥
*   **Médicos**: Requieren DNI, Especialidad y (opcionalmente) configuración de cuenta bancaria/CBU.
*   **Secretarias**: Tienen acceso administrativo limitado (no ven estadísticas de otros médicos a menos que se autorice).
*   **Pacientes**: Se pueden importar masivamente desde Google Contacts o archivos CSV.

## 5. Parámetros de Salud 🏥
*   **Email de Farmacia**: Dirección a la que se envían las recetas automáticas.
*   **Teléfono de Farmacia**: Para envíos por WhatsApp.

---

### 💡 Tips Pro:
1.  **Backup Semanal**: Siempre ejecuta `./scripts/backup_prod.sh` antes de hacer cambios grandes en la configuración.
2.  **HTTPS**: Si usas la app móvil, asegúrate de que el SSL esté activo (vía Nginx Proxy Manager o Cloudflare).
3.  **Logs**: Si algo no funciona (ej: no se sincroniza con Google), revisa el monitor en `http://localhost:8888`.
4.  **Sincronizar Datos**: Para mover datos de la Pi a tu PC local de forma segura, consulta la [Guía de Intercambio de Entorno](file:///home/jmro/Documentos/secretary-app/docs/SHARING_ENVIRONMENT.md).
