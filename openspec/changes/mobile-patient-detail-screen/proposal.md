# Proposal: Mobile Patient Detail Screen (Ficha del Paciente Móvil)

## Context & Motivation
El médico utiliza la aplicación celular (`mobile/`) durante la consulta para acceder de forma ágil a la información clínica clave del paciente citado. La secretaria agenda los turnos desde la PC, por lo que el médico no requiere funciones de creación/edición de turnos en el móvil, sino la consulta rápida de:
1. Medicamentos y tratamientos activos prescritos.
2. Historial cronológico de visitas/atenciones previas.
3. Archivos y estudios adjuntos.
4. Información de contacto (llamadas y WhatsApp).

Actualmente, al tocar un turno en `AppointmentsScreen.jsx`, la app abre únicamente un modal genérico de confirmación de llamada/WhatsApp sin dar acceso a la ficha clínica.

## Proposed Solution
1. **Navegación e Integración**: Al presionar una tarjeta de turno en `AppointmentsScreen.jsx`, navegar a la nueva pantalla `PatientDetailScreen` pasando `patient_id`.
2. **Consumo de API Existente**: Consultar el endpoint GET `/api/users/patients/:id` que provee el envelope completo (`patient`, `appointments`, `prescriptions`, `files`, `stats`, `phoneNumbers`).
3. **Interfaz por Pestañas (Tabs)**:
   - **Pestaña Medicación**: Listado de fármacos, dosis y solicitudes médicas históricas.
   - **Pestaña Visitas**: Historial cronológico de atenciones previas con fecha, médico y motivo.
   - **Pestaña Archivos/Estudios**: Documentos e imágenes adjuntas del paciente.
   - **Header de Contacto**: Acceso directo a llamadas telefónicas y chat de WhatsApp.

## Impact & Scope
- **Frontend Móvil**: `mobile/src/screens/PatientDetailScreen.jsx`, actualización de `AppointmentsScreen.jsx` para navegación modal o mediante React Navigation/Expo Router stack.
- **Backend**: Cero cambios de API requeridos (endpoint `/users/patients/:id` ya operativo).
