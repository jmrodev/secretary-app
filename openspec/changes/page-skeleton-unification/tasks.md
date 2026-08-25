# Tasks: Page Skeleton Unification

## Phase 1: MainLayout Preparation

**[x] Task 1.1: Update MainLayout Component and Styles**
- **Files**: 
  - `client/src/components/templates/MainLayout.jsx`
  - `client/src/components/templates/MainLayout.module.css`
- **Actions**:
  - Rename the inner content wrapper class from `.inner` to `.pageShell` in the CSS module.
  - Refactor `MainLayout` to render a single `<main>` element as the primary content container.
  - Apply standard classes `layout-content-area` and `animate-fade-in` directly to the `<main>` wrapper or `.pageShell`.
  - Add a `noAnimation` boolean prop to dynamically omit the `animate-fade-in` class when set to `true`.
  - Ensure vertical and horizontal spacing is managed via design system tokens.

## Phase 2: Page Components Refactoring

For each of the pages listed below, perform the following refactoring:
- **Remove Outer Wrappers**: Strip out any outer `<div>` or `<main>` tags that serve only as page-level wrappers.
- **Semantic Tags**: Change the root element to a semantic tag like `<section>`, `<article>`, or a standard `<div>` (do not use `<main>`).
- **Remove Boilerplate Classes**: Delete CSS classes mimicking the layout orchestrator behavior (`layout-content-area`, `animate-fade-in`, `*pageOrchestrator`, `.pageWrapper`, `.mainContent`).
- **Clean CSS Modules**: Remove orphaned classes from their corresponding `*Page.module.css` files.

**[x] Task 2.1: Refactor Appointments & Auth Pages**
- `client/src/features/appointments/AppointmentsPage.jsx` (and `.module.css`)
- `client/src/features/auth/LoginPage.jsx` (and `.module.css`)
- `client/src/features/auth/ProfilePage.jsx` (and `.module.css`)
- `client/src/features/auth/RegisterPage.jsx` (and `.module.css`)
- `client/src/features/auth/TempAccessPage.jsx` (and `.module.css`)

**[x] Task 2.2: Refactor Chat, Config & Dashboard Pages**
- `client/src/features/chat/ChatPage.jsx` (and `.module.css`)
- `client/src/features/config/SystemConfigPage.jsx` (and `.module.css`)
- `client/src/features/dashboard/DashboardPage.jsx` (and `.module.css`)

**[x] Task 2.3: Refactor Doctors, Finances & Institutions Pages**
- `client/src/features/doctors/DoctorsPage.jsx` (and `.module.css`)
- `client/src/features/finances/FinancesPage.jsx` (and `.module.css`)
- `client/src/features/institutions/InstitutionsPage.jsx` (and `.module.css`)

**[x] Task 2.4: Refactor Insurances & Medical Documents Pages**
- `client/src/features/insurances/InsurancesPage.jsx` (and `.module.css`)
- `client/src/features/medical_documents/MedicalDocumentsPage.jsx` (and `.module.css`)
- `client/src/features/medical_documents/PublicRequestPage.jsx` (and `.module.css`)
- `client/src/features/medical_documents/RequestsPage.jsx` (and `.module.css`)

**[x] Task 2.5: Refactor Patients & Rentals Pages**
- `client/src/features/patients/PatientsPage.jsx` (and `.module.css`)
- `client/src/features/patients/PublicRegisterPage.jsx` (and `.module.css`)
- `client/src/features/rentals/RentalsPage.jsx` (and `.module.css`)

**[x] Task 2.6: Refactor Reports & Admin Users Pages**
- `client/src/features/reports/AuditLogsPage.jsx` (and `.module.css`)
- `client/src/features/reports/ReportsPage.jsx` (and `.module.css`)
- `client/src/features/users/AdminUsersPage.jsx` (and `.module.css`)
