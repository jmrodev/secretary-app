# Módulo de Auditoría y Trazabilidad - Arquitectura 🔍🛡️

Este documento describe la arquitectura, diseño y patrones del **Módulo de Auditoría** en **Secretary App**.

---

## 1. Principio de Separación de Incumbencias (Separation of Concerns)
La auditoría se diseña como un módulo separado e independiente para no contaminar la lógica de negocio pura de los servicios. 

La trazabilidad del sistema opera en dos niveles complementarios:

### A. Auditoría de Aplicación (Application-level Auditing)
*   **Destino**: Tabla `audit_logs`.
*   **Responsable**: Helper `audit.js` (`server/utils/system/audit.js`) y `AuditRepository` (`server/repositories/system/auditRepository.js`).
*   **Propósito**: Registrar el comportamiento del usuario y operaciones críticas (inicios de sesión, cambios de configuraciones, exportaciones de historias clínicas, accesos no autorizados, etc.).
*   **Estructura**: Almacena el `user_id`, `username`, la `action` (acción ejecutada), la `ip_address` (desde dónde se ejecutó) y un campo `details` en formato JSON con metadatos específicos.

### B. Inspección y Diferencia de Datos (CRUD Changes)
*   Para auditorías detalladas de modificaciones de entidades (pacientes, obras sociales, etc.), el helper `logCRUD` recibe el estado anterior (`oldData`) y el nuevo estado (`newData`).
*   Esto permite reconstruir el historial completo de cambios (quién modificó qué campo, cuándo y cuál era el valor anterior) sin necesidad de duplicar tablas enteras.

### C. Auditoría de Base de Datos (Database-level Auditing)
*   **Destino**: Tabla `transaction_audits`.
*   **Responsable**: Triggers de base de datos (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE` en la tabla `transactions`).
*   **Propósito**: Garantizar la trazabilidad absoluta de movimientos de fondos y cobros, incluso si los cambios se realizan directamente en la base de datos por consola o herramientas de administración externa, esquivando el backend de Node.

---

## 2. Papelera de Reciclaje (Recycle Bin)
El módulo de auditoría también gestiona el acceso a la papelera de reciclaje a través de la tabla `recycle_bin`.
*   Cuando un registro crítico (como la ficha de un paciente) es eliminado, el sistema realiza un movimiento hacia `recycle_bin` en lugar de una baja física permanente (`DELETE`).
*   Esto permite a los administradores inspeccionar los datos eliminados y restaurarlos en caso de error.

---

## 3. Ejemplo de Uso en Controladores (Backend)
Para auditar una acción de actualización en un controlador:

```javascript
const audit = require('../../utils/system/audit');

// Al actualizar un paciente:
await audit.logCRUD(req, 'PATIENT_UPDATE', 'patient', patientId, oldPatientData, newPatientData);
```
