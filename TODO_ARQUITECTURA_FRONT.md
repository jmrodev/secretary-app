# Lista de Tareas para Corrección de Arquitectura Frontend

Este documento lista las violaciones detectadas según `ARQUITECTURA.md` y los pasos para resolverlas.

## 🚩 Problemas Críticos

### 1. Uso de Tailwind CSS (PROHIBIDO)
Se detectó un uso extensivo de clases de Tailwind en varios componentes.
**Solución**: 
- Extraer las clases a un archivo `.css` propio del componente.
- Usar nomenclatura **BEM** (`block__element--modifier`).
- Referenciar variables de CSS (`var(--color-primary)`, etc.).

**Componentes afectados (Ejemplos):**
- [ ] `features/doctors/components/DoctorsManager.jsx` (Parcialmente corregido)
- [ ] `features/insurances/InsurancesPage.jsx` (Parcialmente corregido)
- [ ] `features/users/AdminUsersPage.jsx`
- [ ] `features/users/components/UserManager.jsx`
- [ ] `features/reports/components/AuditLogTable.jsx`
- [ ] `components/molecules/PhoneNumbersManager.jsx`
- [ ] (Ver lista completa en `front_architecture_issues.md`)

### 2. Uso de `!important` en CSS (PROHIBIDO)
Se encontraron múltiples instancias de `!important` que rompen la jerarquía de estilos.
**Solución**:
- Aumentar la especificidad de los selectores (ej: `.root-class .sub-class`).
- Reestructurar el CSS para que el orden de cascada sea natural.

**Archivos afectados:**
- [ ] `styles/layout-dashboard.css`
- [ ] `styles/base.css`
- [ ] `features/finances/components/InstitutionFinances.css` (Corregido)
- [ ] `features/appointments/components/ScheduleTimeBlock.css`
- [ ] `features/patients/components/PatientDetailsView.css` (Uso crítico detectado)

### 3. Falta de archivos CSS (Regla: Un Componente = Un CSS)
Muchos componentes `.jsx` no tienen su correspondiente archivo `.css`.
**Solución**:
- Crear el archivo `.css` para cada componente.
- Mover los estilos (incluyendo los de Tailwind extraídos) a este nuevo archivo.

**Archivos afectados:**
- [ ] `features/auth/LoginPage.jsx` -> Crear `LoginPage.css`
- [ ] `features/users/AdminUsersPage.jsx` -> Crear `AdminUsersPage.css`
- [ ] `features/appointments/components/ScheduleTimeline.jsx` -> Crear `ScheduleTimeline.css`
- [ ] (Ver lista completa en `front_architecture_issues.md`)

### 4. Paths Relativos Profundos
Aunque el script inicial no detectó muchos, se debe asegurar que se use `@/` para todos los imports.
**Solución**:
- Reemplazar `../../../../` por `@/`.

## 🛠️ Guía de Acción Rápida

Para cada componente con problemas:
1. Crea/Renombra el archivo CSS: `ComponentName.css`.
2. Importa el CSS en el JSX: `import './ComponentName.css';`.
3. Identifica clases de Tailwind y crea clases BEM equivalentes.
4. Si hay `!important`, busca el selector que está causando el conflicto y ajusta la especificidad sin usar el hack.
5. Verifica que los colores usen los tokens del sistema (`var(--...)`).

## ✅ Avances
- [x] Renombrado `DoctorsInfo.css` a `DoctorsManager.css`.
- [x] Eliminado Tailwind de `DoctorsManager.jsx`.
- [x] Eliminado Tailwind de `InsurancesPage.jsx`.
- [x] Eliminados `!important` de `InstitutionFinances.css`.
- [x] Eliminado Tailwind y creado `AdminUsersPage.css` para `AdminUsersPage.jsx`.
- [x] Corregidos paths relativos en `AppRouter.jsx` usando el alias `@/`.
- [x] Eliminado Tailwind y creado `UserManager.css` para `UserManager.jsx`.
- [x] Eliminado Tailwind y creado `UserManagement.css` para `UserManagement.jsx`.
- [x] Eliminado Tailwind y creado `AuditLogTable.css` para `AuditLogTable.jsx`.
- [x] Eliminado Tailwind y creado `AuditLogManager.css` para `AuditLogManager.jsx`.
- [x] Eliminado Tailwind de `LoginForm.jsx`.
- [x] Eliminados 19 usos de `!important` en `PatientDetailsView.css` mediante especificidad.
- [x] Eliminado Tailwind y corregidos paths en `PhoneNumbersManager.jsx`.
- [x] Creado `ScheduleTimeline.css` y reemplazados emojis por `<Icon />` en `ScheduleTimeline.jsx`.
- [x] Refactorizadas `LicenseReportTable.jsx` y `CertificateReportTable.jsx` para usar clases BEM de `MedicalReportTable.css`.
- [x] Creado `LoginPage.css`, desacoplado el layout de `LoginForm.css` y aplicado BEM en ambos.
- [x] Eliminado `!important` de `ScheduleTimeBlock.css` mediante especificidad.
- [x] Eliminados `!important` de `base.css` y `layout-dashboard.css`.
- [x] Refactorizada feature `config`: creados `ConfigField.css`, `IntegrationMetaWhatsApp.css`, `IntegrationRemoteAccess.css` y aplicados átomos/BEM.
- [x] Refactorizados `GeneralSettings.jsx`, `BillingSettings.jsx` y `CommunicationSettings.jsx` con sus respectivos CSS y estandarización de iconos/Atoms.
- [x] Finalizada feature `reports`: Refactorizados `ReportTabs.jsx`, `ReportFilters.jsx` y `ReportsDashboard.jsx`. Estandarizados iconos y creados archivos CSS BEM.
- [x] Creados archivos CSS faltantes para `DoctorsPage.jsx` y `AuditLogsPage.jsx` (Regla 1:1).
- [x] Refactorizados átomos base: `Select.jsx` y `ProtectedRoute.jsx` ahora tienen su propio CSS.

---
*Referencia: /home/cima/Documentos/secretary-app/docs/ARQUITECTURA.md*
