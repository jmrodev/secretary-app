# Arquitectura y Estándares de Código - Secretary App 🩺💼

Este documento detalla los estándares de diseño, arquitectura y convenciones técnicas aplicados en el proyecto **Secretary App**.

---

## 1. Arquitectura de UI (Atomic Design)
Clasificamos y ubicamos los componentes estrictamente en su nivel jerárquico correspondiente dentro de `client/src/components/` y carpetas de características (`features/`):

- **Atoms (Átomos)**: Componentes gráficos básicos e indivisibles (ej. `Button`, `Icon`, `Loading`, `Input`). No contienen lógica de negocio.
- **Molecules (Moléculas)**: Combinación de átomos con lógica mínima o de estado local (ej. `ReminderItem`, `SearchBar`, `FormGroup`).
- **Organisms (Organismos)**: Estructuras funcionales complejas que agrupan moléculas y átomos, a menudo conectados a contextos (ej. `CashMonitorCard`, `DashboardReminders`, `GlobalWhatsappMessenger`).
- **Templates (Plantillas)**: Layouts estructurales que definen la disposición espacial de la página (ej. `MainLayout`).
- **Pages (Páginas)**: Vistas principales mapeadas directamente por el enrutador de React (`react-router-dom`).

---

## 2. Estilos y CSS
- **CSS Modules**: Usamos exclusivamente CSS Modules (`styles.module.css`) para todos los componentes de React, previniendo colisiones de selectores en el árbol global.
- **Metodología BEM**: Los nombres de clases dentro del CSS deben seguir la convención BEM (`bloque__elemento--modificador`).
- **Sin Estilos inline**: Está estrictamente prohibido usar estilos en línea (`style={{...}}`) salvo para valores dinámicos calculados por JavaScript en tiempo de ejecución.

---

## 3. Backend (MVC + Repository)
El servidor Express en `server/` sigue una separación de responsabilidades estricta:

- **Routes (Rutas)**: Definen los endpoints HTTP de Express y aplican middlewares (autenticación, autorización, validación de esquemas).
- **Controllers (Controladores)**: Manejan el ciclo de petición/respuesta (`req`, `res`), validan datos iniciales y delegan en los servicios.
- **Services (Servicios)**: Contienen toda la lógica de negocio y reglas del dominio.
- **Repositories (Repositorios)**: Encapsulan el acceso a datos y las consultas a la base de datos (mediante Knex o SQL directo parametrizado).

---

## 4. Internacionalización (i18n)
- **Cero Texto Plano**: Todo texto visible para el usuario final en la interfaz debe pasar por el helper de traducción `t('key')`. 
- **Estructura**: Las traducciones se organizan en archivos JSON/JS dentro de `client/src/constants/languages/`.

---

## 5. Motor de Precios y Finanzas
La lógica de tarificación y facturación está centralizada a nivel de base de datos mediante la función `fn_calculate_service_price` y el procedimiento `sp_book_appointment` para asegurar consistencia absoluta:

- **Tarifa Base del Médico**: Se obtiene de la tabla `doctors` según el tipo de servicio (consulta presencial, consulta virtual, receta, certificado, licencia).
- **Tarifa de Cobertura de Obra Social (Institución)**: Si el turno tiene asociada una institución, se extrae el valor base de `institutions.base_price`, el cual reemplaza la tarifa base del médico.
- **Descuentos y Copagos del Paciente**: Se extraen de la tabla `patients`:
  - `tariff_override`: Un precio fijo que anula por completo el cálculo y se cobra directamente al paciente (ej: un copago fijo pre-acordado).
  - `tariff_percent`: Ajuste porcentual (positivo o negativo) calculado sobre el precio base activo. Si el paciente tiene un copago del 30% en su obra social, se calcula ese porcentaje como deuda del paciente, y el 70% restante se asigna automáticamente como saldo a cobrar a la institución.

- **Devengación de Deuda (Deuda Real vs. Deuda Futura)**:
  Para evitar que un paciente que simplemente tiene turnos agendados en el futuro figure como "deudor" en sus balances contables o historial, el sistema implementa un filtro a nivel de consultas (`statsRepository` y `transactionRepository`):
  *   **Transacción Creada**: Se crea en estado `pending` inmediatamente al agendar el turno (garantiza la integridad de datos).
  *   **Deuda Activa**: Solo se computa y muestra como deuda real si el estado del turno asociado está en **`completed`**, **`attended`**, **`arrived`** o **`absent`** (es decir, el servicio ya se prestó o el paciente se ausentó sin avisar). Los turnos en estado `pending`, `scheduled` o `reserved` no suman a los saldos deudores del paciente.

---

## 6. Lógica Financiera del Médico
El sistema realiza un seguimiento contable individualizado para cada profesional médico en la tabla `transactions` y a través de vistas agregadas:

- **Asignación de Ingresos**: Todas las transacciones derivadas de la actividad del consultorio (consultas, recetas, coberturas institucionales) guardan el `doctor_id` del profesional que brindó la atención.
- **Saldos Diarios y Conciliación**: La vista `view_daily_balances` consolida los ingresos diarios agrupándolos por médico y método de pago (efectivo vs transferencia bancaria/tarjeta).
- **Retiros de Efectivo (`is_withdrawal`)**: Cuando un médico retira efectivo de la caja del consultorio:
  *   Se registra una transacción con `is_withdrawal = 1`.
  *   El monto del retiro se almacena como un valor positivo, pero en los cómputos de balance y arqueo de caja se deduce automáticamente del saldo total disponible para ese médico.
  *   Cada retiro debe quedar registrado con el `doctor_id` correspondiente para auditar el flujo de egresos.

---

## 7. Trazabilidad y Auditoría (Audit Log)
El sistema implementa mecanismos tanto a nivel de aplicación (Node) como de base de datos (Triggers) para registrar qué persona gestionó cada acción:

- **Trazabilidad de Turnos**: 
  El procedimiento `sp_book_appointment` acepta el parámetro `p_created_by` (el identificador del usuario, sea secretaria o el propio médico). Este valor se almacena de forma inmutable en la columna `created_by` de la tabla `appointments` para auditar la creación del turno.
- **Auditoría de Transacciones Financieras**:
  La tabla `transaction_audits` registra automáticamente los cambios en las transacciones a través de triggers de base de datos (`trg_audit_transaction_insert`, `trg_audit_transaction_update`, `trg_audit_transaction_delete`):
  *   **Acciones**: Registra si fue una inserción, actualización o eliminación.
  *   **Historial de importes**: Guarda el valor anterior (`old_amount`) y el nuevo (`new_amount`).
  *   **Historial de estados**: Guarda el estado anterior (`old_status`) y el nuevo (`new_status`).
  *   **Usuario de cambio (`changed_by_user_id`)**: Se puede inyectar en las operaciones de actualización para registrar la trazabilidad del usuario que modificó o eliminó el registro contable.




