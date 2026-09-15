# Tasks: Patient Details Screen Refactoring & Ratings Integration

## Phase 1: Shared Atomic Component Extraction (`RatingStars`) (TDD)

- [ ] 1.1 Add unit tests for `RatingStars` atom (RED) (`client/src/components/atoms/RatingStars/__tests__/RatingStars.test.jsx`)
  - Verify rendering 5 stars with correct filled/inactive classes based on `rating` prop (0 to 5).
  - Verify color class variants (`gold`, `blue`, `pink`).
  - Verify accessibility attributes (`role="img"`, `aria-label`).
- [ ] 1.2 Implement `RatingStars` atom and CSS module (GREEN) (`client/src/components/atoms/RatingStars/RatingStars.jsx`, `RatingStars.module.css`, `index.js`)
  - Render 5 star icons with design token variables (`--amber-400`, `--sky-500`, `--pink-500`).
  - Export named `RatingStars`.
- [ ] 1.3 Refactor `PatientList.jsx` to consume shared `RatingStars` atom (`client/src/features/patients/components/views/PatientList.jsx`)
  - Remove local `RatingStars` function declaration.
  - Import `RatingStars` from `@/components/atoms/RatingStars`.

---

## Phase 2: Patient Details Header & Ratings Organism (TDD)

- [ ] 2.1 Add unit tests for `PatientDetailsHeader` (RED) (`client/src/features/patients/components/views/__tests__/PatientDetailsHeader.test.jsx`)
  - Verify rendering of patient name, DNI, insurance/particular status, and calculated age.
  - Verify debt pill rendering and `onPayDebt` invocation when `total_debt > 0`.
  - Verify Financial (gold), Attendance (blue), and Behavior (pink) ratings rendered via `RatingStars`.
  - Verify behavior note icon and tooltip rendered when `behavior_rating_note` is present.
  - Verify interactive behavior rating click and keyboard trigger `onEditRating` when `canEditRating = true` (Mitigates Threat: Unauthorized Rating Edit).
  - Verify non-interactive behavior rating when `canEditRating = false`.
  - Verify header actions (Back, Print, New toggle, Edit, Delete).
- [ ] 2.2 Implement `PatientDetailsHeader` and CSS module (GREEN) (`client/src/features/patients/components/views/PatientDetailsHeader.jsx`, `PatientDetailsHeader.module.css`)
  - Construct header organism with responsive metadata chips, rating badges, and action buttons using tokens from `variables.css`.

---

## Phase 3: Tab Organisms & Modals Extraction (TDD)

- [ ] 3.1 Implement `PrescriptionDetailModal` molecule (`client/src/features/patients/components/modals/PrescriptionDetailModal.jsx`)
  - Extract prescription detail dialog from `PatientDetailsView`.
  - Support formatted medication lines, diagnosis display, copy link, and WhatsApp share.
- [ ] 3.2 Add unit tests for `PatientMedicationsTab` (RED) (`client/src/features/patients/components/views/tabs/__tests__/PatientMedicationsTab.test.jsx`)
  - Verify chronic medications grid rendering and empty state fallback.
  - Verify prescription records table, copy link, WhatsApp share, and preview trigger.
- [ ] 3.3 Implement `PatientMedicationsTab` and CSS module (GREEN) (`client/src/features/patients/components/views/tabs/PatientMedicationsTab.jsx`, `PatientMedicationsTab.module.css`)
  - Encapsulate medication cards and prescription table.
- [ ] 3.4 Add unit tests for `PatientDocumentsTab` (RED) (`client/src/features/patients/components/views/tabs/__tests__/PatientDocumentsTab.test.jsx`)
  - Verify file upload form validation and submission.
  - Verify documents table rendering, loading state, and viewer modal trigger.
- [ ] 3.5 Implement `PatientDocumentsTab` and CSS module (GREEN) (`client/src/features/patients/components/views/tabs/PatientDocumentsTab.jsx`, `PatientDocumentsTab.module.css`)
  - Encapsulate file upload form and files list.

---

## Phase 4: View Coordinator Refactor & Desktop Layout Fix (TDD)

- [ ] 4.1 Add integration tests for `PatientDetailsView` (RED) (`client/src/features/patients/components/views/__tests__/PatientDetailsView.test.jsx`)
  - Verify tab switching across all 6 tabs (`general`, `history`, `finances`, `medications`, `documents`, `chat`).
  - Verify clean printable view toggle (`isCleanView`).
  - Verify prop delegation to `PatientDetailsHeader` including `onEditRating` and `canEditRating`.
- [ ] 4.2 Refactor `PatientDetailsView.jsx` into thin coordinator (< 150 lines) (`client/src/features/patients/components/views/PatientDetailsView.jsx`)
  - Remove `/* eslint-disable max-lines */` comment.
  - Delegate tab content rendering to `PatientInfoBlock`, `PatientHistoryTable`, `PatientFinancialSidebar`, `PatientMedicationsTab`, `PatientDocumentsTab`, and `WhatsappChatHistory`.
- [ ] 4.3 Fix `PatientDetailsView.module.css` grid layout (`client/src/features/patients/components/views/PatientDetailsView.module.css`)
  - Remove orphaned `grid-template-columns: 2fr 1fr` at `>= 1024px`.
  - Apply clean single-column container layout using `--spacing-*` tokens.
- [ ] 4.4 Wire `onEditRating` and `canEditRating` in `PatientsPage.jsx` (`client/src/features/patients/PatientsPage.jsx`)
  - Forward `onEditRating={handleOpenBehaviorRatingModal}` and `canEditRating={isStaff}` to `PatientDetailsView`.

---

## Phase 5: Verification & Quality Assurance

- [ ] 5.1 Run client and server test suites (`pnpm --filter client test && pnpm --filter server test`)
- [ ] 5.2 Run lint check (`pnpm lint`) and ensure zero violations in touched files.
- [ ] 5.3 Validate SDD status (`gentle-ai sdd-status patient-details-view`).
