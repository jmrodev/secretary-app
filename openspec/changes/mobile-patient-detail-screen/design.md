# Design Document: Mobile Patient Detail Screen

## Architecture & UI Component Plan

### 1. Component Hierarchy (Atomic Design)
- **Pages / Screens**: `PatientDetailScreen` (`mobile/src/screens/PatientDetailScreen.jsx`).
- **Molecules**: 
  - `PatientHeaderCard`: Header summary with avatar, name, DNI, health insurance.
  - `ContactActionBar`: Call / WhatsApp quick buttons.
  - `TabSelector`: Custom tab switcher (Medicación | Visitas | Archivos).
  - `MedicationCard`: Item card displaying drug name, dosage, instructions.
  - `VisitHistoryCard`: Item card displaying date, reason, status.
  - `PatientFileCard`: Item card displaying document filename and upload date.

### 2. State & Data Flow
- Endpoint: `apiFetch('/users/patients/' + patientId)`
- Local State:
  - `patientData`: Object returned from API.
  - `activeTab`: `'medications' | 'visits' | 'files'` (default: `'medications'`).
  - `loading`: boolean.
  - `refreshing`: boolean.

### 3. Styling Guidelines (BEM & Standard Styles)
- Strict dark/light theme support using existing color system.
- Clean touch targets (minimum 44x44 dp) for mobile UX.
