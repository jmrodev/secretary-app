# Specification: Mobile Add Medication

## Requirements

### Requirement 1: Vademecum Autocomplete Search
The mobile app MUST provide a search input in the Add Medication modal that queries `GET /api/medical/vademecum/search?q=<query>` and displays suggested medication names, presentations, and active drugs.

#### Scenario 1.1: Autocomplete suggestion selection
- GIVEN the user types at least 2 characters in the medication search field
- WHEN the API returns matching Vademecum items
- THEN the app renders a list of suggestions showing trade name, presentation, and laboratory
- WHEN the user selects a suggestion
- THEN the fields `medication_name`, `vademecum_id`, and `dosage` are populated

---

### Requirement 2: Dosage & Total Units Calculation
The modal MUST calculate the total estimated units required based on `daily_units` (tomas diarias) multiplied by `duration_days` (días de tratamiento).

#### Scenario 2.1: Real-time unit calculation
- GIVEN daily_units = 2 and duration_days = 30
- WHEN the user enters these values
- THEN the form displays "Total estimado: 60 unidades / comprimidos"

---

### Requirement 3: Medication Persistence
Submitting the form MUST POST to `/api/medical/patients/medications` and append the new record to the patient's active medication list.
