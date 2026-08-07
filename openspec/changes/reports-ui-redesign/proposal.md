# Proposal: Reports UI Redesign ('reports-ui-redesign')

## Context & Motivation
La sección de reportes (`client/src/features/reports`) es una pieza clave para la gestión médica y contable de la clínica. Permite consultar reportes mensuales de turnos, recetas, licencias, certificados, balance financiero y registros de auditoría (`AuditLogs`).

Tras evaluar la estructura actual, se detectaron las siguientes oportunidades de mejora:
1. **Arquitectura de Componentes & Atomic Design**: Existe una mezcla de responsabilidades en la jerarquía. La vista `ReportsDashboard` gestiona pestañas a través de `FeatureToolbar` pero mantiene componentes sueltos como `ReportTabs` sin integración clara. La separación entre Páginas/Vistas (Orquestadores) y Componentes UI/Tablas requiere alineación estricta a patrones Atómicos.
2. **Estilos BEM y CSS Modules**: En varios componentes (como `AppointmentReportTable`, `ReportFilters` y `AuditLogManager`), existe un uso híbrido inconsistente entre CSS Modules (`styles.root`) y clases globales BEM (`report-filters__field`, `appointment-report__table--summary`). Esto compromete el encapsulamiento y el mantenimiento del diseño.
3. **i18n y Localización**: Se identificaron cadenas de texto hardcodeadas ("Sobreturno", "Finde", "Balance General", etc.) y fallbacks directos en español cuando falta la clave i18n, rompiendo la coherencia de internacionalización.
4. **Flujo de Datos y Controlador (`useReportsController`)**: El manejador `handleGenerateReport` agrupa llamadas masivas de `Promise.all` para balance y múltiples ramas condicionales para cada pestaña. Falta una abstracción de hooks o sub-controladores por reporte y gestión de estados de error/carga por vista.

## Proposed Solution
1. **Refactorización Atomic Design**:
   - **Pages**: `ReportsPage.jsx`, `AuditLogsPage.jsx` (Orquestadores de nivel superior).
   - **Organisms**: `ReportsDashboard.jsx`, `BalanceView.jsx`, `AuditLogManager.jsx`.
   - **Molecules**: `ReportFilters.jsx`, `ReportTabs.jsx`, `ReportStatCard.jsx`.
   - **Atoms**: Utilizar los componentes atómicos existentes (`Button`, `Select`, `Input`, `Icon`, `Badge`) sin lógica duplicada.
2. **Estandarización CSS Modules + Metodología BEM**:
   - Refactorizar las hojas de estilo (`*.module.css`) para que sigan una nomenclatura de bloques BEM dentro de los CSS Modules (`styles['reports-filters__control']`).
   - Eliminar clases de utilidad CSS globales imprevistas o no encapsuladas.
3. **i18n Completo**:
   - Externalizar todas las cadenas y fallbacks a `useLanguage` y archivos de traducción (`es.js` / `en.js`).
   - Garantizar formateo consistente de moneda, fechas y etiquetas de estado.
4. **Refactor de Hooks & Controllers**:
   - Desacoplar `useReportsController` en sub-hooks especializados (ej: `useAppointmentReports`, `useFinancialBalance`) manteniendo una API clara e inmunizada ante errores de red.

## Impact & Scope
- **Frontend Web**: `client/src/features/reports/` (Páginas, Vistas, Componentes de Tabla, Filtros, Hooks y CSS Modules).
- **Diccionarios i18n**: Cadenas correspondientes en la configuración de traducción del cliente (`client/src/i18n/` o equivalente).
- **Backend / APIs**: Sin cambios de contratos en API ni endpoints (se consumen los endpoints existentes `/medical/prescriptions/export/json`, `/medical/licenses/export/json`, `/medical/certificates/export/json`, `/logs` y reportes mensuales).
