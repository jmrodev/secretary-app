# Spec: Patient Details Screen Refactoring & Ratings Integration

## Context
The patient details view is opened when a user clicks the eye icon (`visibility`) on any patient row in `PatientList`. This specification governs the layout, identity summary, clinical/behavioral ratings, tab navigation, and atomic component decomposition of the patient details screen.

---

## ADDED Requirements

### Requirement: Patient Details Header & Identity Summary
The patient details view SHALL render a dedicated header organism (`PatientDetailsHeader`) at the top of the profile. The header MUST display the patient's full name, DNI, health insurance (or particular status), affiliate number when present, and calculated age. If the patient has outstanding debt (`total_debt > 0`), the header MUST render an interactive debt pill that triggers the debt payment workflow on click.

#### Scenario: Patient with debt displays interactive debt pill
- GIVEN a patient profile with `total_debt` equal to `15000`
- WHEN the user opens the patient details view
- THEN the header displays the debt amount formatted as currency (`$15,000`)
- AND clicking the debt badge triggers the debt payment modal

#### Scenario: Particular patient without insurance
- GIVEN a patient profile with `insurance_name` as null
- WHEN the user opens the patient details view
- THEN the header displays `Particular` as the insurance coverage badge

---

### Requirement: Clinical & Administrative Ratings in Header
The header MUST render the three core patient rating metrics:
1. **Financial Rating**: Gold 5-star rating based on debt history.
2. **Attendance Rating**: Blue 5-star rating based on attended vs. missed appointments.
3. **Behavior Rating**: Pink 5-star rating based on financial/attendance derivation or staff override.

When `behavior_rating_note` is populated, the behavior rating container MUST display a note indicator icon with a tooltip prefixed by the behavioral note key and containing the full note text.

When the active user is staff (`canEditRating = true`), the behavior rating container MUST be interactive (clickable and focusable via keyboard), and clicking or pressing Enter/Space MUST invoke `onEditRating` with the patient details to open `BehaviorRatingModal`.

When the active user is not staff (`canEditRating = false`), the behavior rating container MUST NOT be interactive and MUST NOT trigger the modal.

#### Scenario: Staff inspects and edits manual behavior rating from details
- GIVEN an active user with staff privileges
- AND a patient with `behavior_rating = 4` and `behavior_rating_note = "Llega tarde reiteradas veces"`
- WHEN the user views the patient details header
- THEN the behavior rating displays 4 pink stars, a note icon, and a tooltip containing `"Llega tarde reiteradas veces"`
- AND clicking the rating container opens `BehaviorRatingModal` populated with the current rating and note

#### Scenario: Derived behavior rating without manual note
- GIVEN a patient with no `behavior_rating_note`
- WHEN the header renders the behavior rating
- THEN the rating displays the auto-derived score without the manual note indicator

#### Scenario: Non-staff user cannot edit ratings
- GIVEN an active user with role other than admin or secretary (`canEditRating = false`)
- WHEN the user views the patient details header
- THEN the behavior rating is rendered in read-only mode without pointer cursor or click handlers

---

### Requirement: Responsive Layout and Design Token Compliance
The patient details view container MUST render a responsive single-column layout across all viewports. The stylesheet MUST NOT define orphaned multi-column grid templates that leave empty whitespace on desktop displays.

All spacing, border radii, card backgrounds, and typography MUST utilize CSS variables defined in `client/src/styles/variables.css` (`--spacing-*`, `--radius-*`, `--dashboard-card-*`, `--text-*`).

#### Scenario: Desktop viewport rendering fills available space
- GIVEN a desktop viewport width greater than or equal to 1024px
- WHEN the patient details view renders
- THEN the main content container expands across the full available content width without leaving empty columns

#### Scenario: Mobile viewport responsiveness
- GIVEN a mobile viewport width less than 768px
- WHEN the patient details view renders
- THEN tab navigation enables horizontal scroll or wrap
- AND header actions stack or align without horizontal clipping

---

### Requirement: Tab Navigation & Organism Decomposition
The patient details view SHALL coordinate six distinct tabs:
- `general`: Renders `PatientInfoBlock`
- `history`: Renders `PatientHistoryTable`
- `finances`: Renders `PatientFinancialSidebar`
- `medications`: Renders `PatientMedicationsTab`
- `documents`: Renders `PatientDocumentsTab`
- `chat`: Renders `WhatsappChatHistory`

The view coordinator (`PatientDetailsView.jsx`) MUST delegate tab rendering and local sub-feature state to standalone organisms:
1. `PatientMedicationsTab.jsx`: SHALL encapsulate the chronic medications grid, empty state, and the prescriptions repository table.
2. `PatientDocumentsTab.jsx`: SHALL encapsulate the file upload form, file validation, and the uploaded documents repository table.
3. `PrescriptionDetailModal.jsx`: SHALL encapsulate the modal dialog displaying prescription details, dosage list, diagnosis, copy link, and WhatsApp share actions.

The refactored `PatientDetailsView.jsx` coordinator file MUST NOT exceed 150 lines of code and MUST NOT contain eslint `max-lines` disable comments.

#### Scenario: Switching to medications tab
- GIVEN a user on the patient details screen
- WHEN the user clicks the `Prescriptions` tab
- THEN `PatientMedicationsTab` renders the list of chronic medications and prescription history

#### Scenario: Uploading a file in documents tab
- GIVEN a user on the `Documents` tab
- WHEN a user selects a file, enters a description, and submits the upload form
- THEN `PatientDocumentsTab` executes the upload request and refreshes the document table on success

---

### Requirement: Shared RatingStars Atom
The system SHALL provide a shared atom `RatingStars` at `client/src/components/atoms/RatingStars/RatingStars.jsx`. The atom MUST accept `rating` (number 0 to 5) and `colorClass` (`gold`, `blue`, `pink`), and SHALL render 5 accessible star icons reflecting the score.

Both `PatientList` and `PatientDetailsHeader` MUST consume the shared `RatingStars` atom.

#### Scenario: RatingStars renders correct star states
- GIVEN a rating value of 3
- WHEN `RatingStars` renders
- THEN 3 stars have the filled/active class and 2 stars have the inactive class
