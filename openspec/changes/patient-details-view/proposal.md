# Proposal: Patient Details Screen Refactoring and Behavioral Context Integration

## Intent
Provide a modular, responsive, and context-rich Patient Details screen opened via the eye icon from the patient list: decompose the monolithic 627-line view into Atomic Design subcomponents, eliminate the desktop 2-column layout flaw, surface patient behavioral, financial, and attendance ratings with interactive note tooltips in the header, and ensure strict design token compliance.

## Problem Statement
1. **Monolithic Anti-Pattern**: `PatientDetailsView.jsx` spans 627 lines with disabled `max-lines` lint checks, coupling navigation, tab routing, inline medication cards, prescription tables, file upload forms, and modal dialogs.
2. **Desktop Layout Flaw**: `.PatientDetailsView__grid` defines `grid-template-columns: 2fr 1fr` at `>= 1024px` with no corresponding sidebar element, leaving 33% of the viewport empty on desktop.
3. **Context Disconnect (Ratings & Notes)**: While `PatientList` computes and displays attendance, financial, and behavior ratings (with manual note tooltips and staff override triggers), `PatientDetailsView` completely omits them in its header. Staff cannot see or edit behavioral context from within the detail view.
4. **Atom Duplication**: `RatingStars` is locally declared within `PatientList.jsx`, hindering reuse across patient views.

## Proposed Changes
1. **Atoms & Molecules**:
   - Extract `RatingStars` to `client/src/components/atoms/RatingStars/RatingStars.jsx`.
   - Create `PrescriptionDetailModal.jsx` in `client/src/features/patients/components/modals/`.
2. **Organisms & View Decomposition**:
   - Create `PatientDetailsHeader.jsx` to render identity badges (DNI, Insurance, Debt) and ratings (Financial, Attendance, Behavior with tooltip & edit trigger).
   - Create `PatientMedicationsTab.jsx` to house chronic medications cards and the prescription history table.
   - Create `PatientDocumentsTab.jsx` to house the file upload form and files repository table.
   - Refactor `PatientDetailsView.jsx` to act strictly as a thin coordinator (< 150 lines).
3. **Wiring**:
   - Pass `onEditRating` and `canEditRating` from `PatientsPage.jsx` to `PatientDetailsView` and down to `PatientDetailsHeader`.
4. **Layout & Styling**:
   - Fix `PatientDetailsView.module.css` grid layout and replace ad-hoc styles with design tokens (`client/src/styles/variables.css`).
5. **Testing**:
   - Vitest component tests for `PatientDetailsHeader`, `PatientMedicationsTab`, `PatientDocumentsTab`, and `PatientDetailsView`.

## Rollback Plan
Clean git revert of frontend commits. No database migrations or server contract changes are introduced.
