# Specification: Mobile Patient Detail Screen

## Requirements

### Requirement 1: Touch Appointment to Open Patient Detail
The mobile application MUST navigate to the `PatientDetailScreen` when the user taps any appointment card in the `AppointmentsScreen`.

#### Scenario 1.1: Tapping appointment opens patient detail
- GIVEN a list of daily appointments displayed on `AppointmentsScreen`
- WHEN the user taps an appointment item with a valid `patient_id`
- THEN the app transitions to `PatientDetailScreen` with the selected patient's ID
- AND fetches full patient data from `/users/patients/:id`

---

### Requirement 2: Display Patient Header & Contact Actions
The `PatientDetailScreen` MUST display the patient's header summary (Name, DNI, Age, Health Insurance/Obra Social) and direct action buttons for Phone Call and WhatsApp.

#### Scenario 2.1: Executing contact action
- GIVEN the patient details are loaded
- WHEN the user presses the "Llamar" button
- THEN the app prompts to initiate a native phone call to the primary phone number
- WHEN the user presses the "WhatsApp" button
- THEN the app opens the native WhatsApp application with `https://wa.me/<phone>`

---

### Requirement 3: Categorized Tabs for Clinical History
The `PatientDetailScreen` MUST provide clear tabbed views:
1. **Medicación**: Active treatments, dosages, and historical prescriptions (`prescriptions` array).
2. **Historial de Visitas**: Prior appointments (`appointments` array) sorted in reverse chronological order showing date, time, reason, and status.
3. **Archivos / Estudios**: Attached documents and files (`files` array).

#### Scenario 3.1: Switching tabs displays relevant records
- GIVEN a loaded patient profile
- WHEN the user selects the "Medicación" tab
- THEN only medication and prescription items are rendered
- WHEN the user selects the "Visitas" tab
- THEN all historical appointments are rendered with date, reason, and doctor status
