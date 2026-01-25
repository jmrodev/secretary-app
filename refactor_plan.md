# Refactoring Plan: Atomic Design & Clean Architecture

## Objective
Refactor the entire **Secretary App** frontend to strictly follow **Atomic Design principles** and **Separation of Concerns** using Custom Hooks for logic (Service/Controller layer) and Functional Components for UI (View layer).

## Architecture Pattern
For each page/feature, we will implement:
1.  **Controller Hook (`usePageController.js`)**: Handles state, data fetching, side effects, and business logic. Returns only data and handler functions.
2.  **Organisms**: Complex UI sections (e.g., `PatientTable`, `AppointmentCalendar`, `FinanceCharts`) built from smaller Atoms/Molecules.
3.  **Page Component (`Page.jsx`)**: A dumb container that calls the hook and passes data to Organisms.
4.  **Atoms/Molecules**: Reusable UI elements (Buttons, Badges, Modals, Inputs).

## Progress Status

### ✅ Completed
-   **Dashboard** (`Dashboard.jsx` + `useDashboardController`)
-   **Institutions** (`Institutions.jsx` + `useInstitutionsController`)
-   **Insurances** (`Insurances.jsx` + `useInsurancesController`)
-   **Finances** (`Finances.jsx` + `useFinancesPageController`)
-   **Doctors** (`Doctors.jsx` + `useDoctorsPageController`)
-   **Appointments** (`Appointments.jsx` + `useAppointmentsPageController`)
-   **Patients** (`Patients.jsx` + `usePatientsPageController`)
-   **AdminUsers** (`AdminUsers.jsx` + `UserManagement`)
-   **Audit Logs** (`AuditLogs.jsx` + `useAuditLogsController`)
-   **Messages** (`Messages.jsx` + `useMessagesPageController`)
-   **Profile** (`Profile.jsx` + `useProfileController`)

### 🔄 In Progress / Next Up
-   *Review and Testing*

### 📋 To Do List
-   [x] **Finances Page** (Validated)
-   [x] **Doctors Page** (Validated)
-   [x] **Patients Page** (Done)
-   [x] **Appointments Page** (Validated)
-   [x] **Audit Logs** (Done)
-   [x] **Messages Page** (Done)
-   [x] **Profile Page** (Done)

## Final Status
All core pages have been refactored to use the **Atomic Design + Controller Hook** pattern. The codebase now consistently separates UI components (Organisms/Molecules/Atoms) from Business Logic (Hooks).
