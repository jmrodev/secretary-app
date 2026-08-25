# Tasks: Layout Unification

## Phase 1 — Preparation

**1.1** Read i18n locale files and verify/add missing keys:
- `chat`, `requests`, `outreach`, `audit_logs`, `patients`
- Files: `client/src/i18n/locales/*.json` (or equivalent)

---

## Phase 2 — Pass 1: Prop Normalization

**2.1** `OutreachPage.jsx` — add `wide flush title={t('outreach')}`  
**2.2** `AuditLogsPage.jsx` — add `flush title={t('audit_logs')}`  
**2.3** `ReportsPage.jsx` — add `flush` (already has `wide title`)  
**2.4** `AdminUsersPage.jsx` — add `wide flush` to the conditional render branches  
**2.5** `ChatPage.jsx` — add `title={t('chat')}`  
**2.6** `RequestsPage.jsx` — add `title={t('requests')}`  
**2.7** `PatientsPage.jsx` — add `title={t('patients')}` to both conditional branches  

---

## Phase 3 — Pass 2: Inner Container Audit

For each: read CSS → apply decision tree → keep or remove.

**3.1** `DashboardPage.jsx:40` — audit `dashboard-page-orchestrator__main`  
**3.2** `FinancesPage.jsx:82` — audit `finances-page-orchestrator__main`  
**3.3** `InstitutionsPage.jsx:88` — audit `dashboard-layout__main`  
**3.4** `RequestsPage.jsx:40` — audit `dashboard-layout__main`  
**3.5** `RentalsPage.jsx:38` — audit `rentals-page-orchestrator` div  

---

## Phase 4 — Verification

**4.1** `pnpm --filter client lint` — must pass with zero errors  
**4.2** Visual check in browser: Dashboard, Patients, Finances, Reports, Outreach — confirm consistent spacing and max-width  
**4.3** Appointments calendar — confirm no layout regression (full-width requirement)  

---

## Phase 5 — Commit

**5.1** Commit Pass 1: `feat: normalize MainLayout props across authenticated pages`  
**5.2** Commit Pass 2 (if under 150 lines): `refactor: remove redundant inner containers from page orchestrators`  
**5.3** Open PR against `development` via `gh pr create`  
