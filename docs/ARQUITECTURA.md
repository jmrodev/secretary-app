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


