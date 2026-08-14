# Spec: Layout Unification — MainLayout Prop Standardization

## Overview

All authenticated pages MUST use `<MainLayout wide flush title={...}>`. 
This spec defines the canonical prop contract and the rules for inner container removal.

---

## Spec 1 — Canonical MainLayout Usage

### Given any authenticated page route
**When** the component renders its root structure  
**Then** it MUST render `<MainLayout wide flush title={t('...')}>` as the outermost element  
**And** the `title` prop MUST be a translated string via `t()` or an explicit static string  
**And** exceptions MUST be documented with an inline comment `{/* layout:exception reason */}`

### Canonical prop matrix

| Page | wide | flush | title |
|------|------|-------|-------|
| AppointmentsPage | ✅ | ✅ | `t('appointments')` (already set) |
| ProfilePage | ✅ | ✅ | `t('profile')` (already set) |
| ChatPage | ✅ | ✅ | `t('chat')` |
| SystemConfigPage | ✅ | ✅ | `t('config')` (already set) |
| DashboardPage | ✅ | ✅ | `t('dashboard')` (already set) |
| DoctorsPage | ✅ | ✅ | `t('doctors')` (already set) |
| FinancesPage | ✅ | ✅ | `t('finances')` (already set) |
| HolidaysPage | ✅ | ✅ | `t('holidays')` (already set) |
| InstitutionsPage | ✅ | ✅ | `t('institutions')` (already set) |
| InsurancesPage | ✅ | ✅ | `t('insurances')` (already set) |
| MedicalDocumentsPage | ✅ | ✅ | `t('medical_documents')` (already set) |
| RequestsPage | ✅ | ✅ | `t('requests')` |
| OutreachPage | ✅ | ✅ | `t('outreach')` |
| PatientsPage | ✅ | ✅ | `t('patients')` |
| RentalsPage | ✅ | ✅ | `t('office_rentals')` (already set) |
| AuditLogsPage | ✅ | ✅ | `t('audit_logs')` |
| ReportsPage | ✅ | ✅ | `t('reports')` (already set) |
| AdminUsersPage | ✅ | ✅ | `t('user_management')` (already set) |
| WhatsappPage | ✅ | ✅ | `t('whatsapp_messenger')` (already set) |

---

## Spec 2 — Inner Container Removal Rules

### Given a page that renders inside MainLayout
**When** the page renders a `<main>` or `<div>` whose ONLY purpose is layout wrapping  
**Then** that element SHOULD be removed if:

**Rule A — Redundant orchestrator main**: The element has a class matching `*-page-orchestrator__main` OR `dashboard-layout__main` AND has no CSS rules that define `display: grid | flex`, `gap`, `overflow`, `height`, or `min-height`.

**Rule B — Layout-defining main stays**: If removing the element would break scroll behavior, grid, or flex children, it MUST remain. Add comment `{/* layout:keep — reason */}`.

### Target elements for removal audit

| File | Element | Class | Decision |
|------|---------|-------|----------|
| `DashboardPage.jsx:40` | `<main>` | `dashboard-page-orchestrator__main` | Audit CSS |
| `FinancesPage.jsx:82` | `<main>` | `finances-page-orchestrator__main` | Audit CSS |
| `InstitutionsPage.jsx:88` | `<main>` | `dashboard-layout__main` | Audit CSS |
| `RequestsPage.jsx:40` | `<main>` | `dashboard-layout__main` | Audit CSS |
| `RentalsPage.jsx:38` | `<div>` | `rentals-page-orchestrator` | Audit CSS |

---

## Spec 3 — i18n Keys

### Given a page that uses a new `title` prop
**When** the key does not exist in the translation files  
**Then** the key MUST be added to all locale files before use  
**And** MUST follow the existing key naming pattern (snake_case)

### New keys required

| Key | Default value (es) |
|-----|--------------------|
| `chat` | `'Chat'` |
| `requests` | `'Solicitudes'` |
| `outreach` | `'Difusión'` |
| `audit_logs` | `'Auditoría'` |
| `patients` | `'Pacientes'` |

> Note: Verify these keys don't already exist before adding. The i18n system uses a flat key map.

---

## Non-Goals

- SHALL NOT change `MainLayout` component internals
- SHALL NOT modify CSS of feature-level organisms (toolbars, sidebars)
- SHALL NOT touch public pages (Login, Register, TempAccess, PublicRequest, PublicRegister)
- SHALL NOT add new visual behavior — this is a structural normalization only
