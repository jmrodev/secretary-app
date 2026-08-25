# Design: Layout Unification

## Architecture Decision

**No new components.** This is a pure normalization pass on existing pages.

The implementation has two passes:

### Pass 1 — Prop Normalization (mechanical, no risk)
Add missing `wide`, `flush`, `title` props to 5 pages.

### Pass 2 — Inner Container Audit (careful, per-page)
For each page in the audit list: read the associated CSS module, determine if the 
`<main>` / `<div>` container defines layout behavior, then decide keep/remove.

---

## Implementation Sequence

```
1. Check i18n keys (read locale files, add missing keys)
2. Pass 1 - prop normalization (5 pages)
   ├── OutreachPage    → add wide flush title
   ├── AuditLogsPage   → add flush title  
   ├── ReportsPage     → add flush
   ├── AdminUsersPage  → add wide flush
   └── ChatPage        → add title
3. Pass 2 - inner container audit (5 pages)
   ├── DashboardPage   → audit dashboard-page-orchestrator__main
   ├── FinancesPage    → audit finances-page-orchestrator__main
   ├── InstitutionsPage → audit dashboard-layout__main
   ├── RequestsPage    → audit dashboard-layout__main
   └── RentalsPage     → audit rentals-page-orchestrator
4. pnpm lint
```

---

## CSS Audit Decision Tree (Pass 2)

For each inner `<main>` or `<div>`:

```
Read CSS module for that class
  ↓
Does it define display:grid|flex, gap, overflow, height, min-height?
  ├── YES → Keep element, add {/* layout:keep — [reason] */}
  └── NO  → Remove element, move children up one level
```

---

## Commit Strategy (within 150-line budget)

Single PR with two commits:
- `feat: normalize MainLayout props across authenticated pages`  
- `refactor: remove redundant inner main containers from page orchestrators`

If Pass 2 removals exceed 150 lines → split into second PR, ask user first (ask-on-risk).

---

## No Sequence Diagram Needed

No async flows, no API changes, no state management changes. 
This is JSX attribute normalization + element removal.
