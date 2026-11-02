# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Secretarias y asistentes de consultorios médicos, administradores de clínicas y profesionales de la salud. Operan en entornos dinámicos de atención al paciente, coordinando turnos en tiempo real, gestionando pagos/deudas, enviando comunicaciones por WhatsApp y consultando fichas clínicas.

## Product Purpose

Secretary App es una solución integral para la gestión de consultorios médicos y clínicas. Su propósito es optimizar la agenda de turnos, la comunicación automatizada y manual con pacientes vía WhatsApp, el registro de historias clínicas y recetas, y el control financiero detallado (caja diaria, retiros de profesionales, deudas de obras sociales y particulares). El éxito significa un flujo diario de consultorio sin fricción, cobranzas claras y trazabilidad total de acciones.

## Positioning

Combina gestión clínica y administrativa con mensajería directa y automatizada de WhatsApp (Go bridge nativo), y un motor financiero con cálculo dinámico de aranceles, copagos y devengación real de deuda por estado de atención.

## Key Workflows

- **Gestión de Agenda y Turnos**: Visualización diaria/semanal, creación rápida de turnos, estados dinámicos (`pending`, `scheduled`, `attended`, `completed`, `absent`, etc.) y confirmaciones.
- **Comunicación con Pacientes**: Chat en vivo y recordatorios automatizados de turnos vía WhatsApp integrado.
- **Ficha del Paciente e Historia Clínica**: Historial médico, recetas crónicas, adjuntos y antecedentes.
- **Administración Financiera y Arqueo**: Control de transacciones, copagos de obras sociales/instituciones, aranceles médicos, conciliación por método de pago y retiros de efectivo de profesionales.

## Technical & Design Constraints

- **Stack**: React 19, Vite, React Router v7, Vanilla CSS con CSS Modules y metodología BEM.
- **Soporte de Temas**: Soporte multi-tema vía `data-theme` (`dark` por defecto, `light`, `dim`). Prohibido hardcodear estilos en línea o valores que deban provenir de variables CSS (`variables.css`).
- **Internacionalización**: Estricto uso de `t('key')` para textos de interfaz (sin texto plano hardcodeado).
