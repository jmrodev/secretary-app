# Tasks: Frontend Style Unification

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,200 total; per-feature PR < 400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | CSS PR → lint PR → 1 PR per feature (migration+BEM) |
| Delivery strategy | ask-on-risk |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: Medium

> Style refactor only; gate is `pnpm build` + `pnpm lint` (server TDD N/A).

### Suggested Work Units

| Unit | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|-----------|----------------------|-----------------|-------------------|
| CSS purge | PR 1 | `rg` import + `styles.` | `pnpm build` | revert files |
| Lint rules | PR 2 | `pnpm lint` | `pnpm lint` | revert config |
| Each feature | PR 3..N | `pnpm lint` | `pnpm build` | revert imports |

## Phase 1: Purge orphaned 1-line CSS modules

- [x] 1.1 PREFLIGHT: for **each** of the 20 candidates, `rg '<name>'` (`styles.`) and `rg 'from ".*<name>\.module\.css"'` repo-wide → confirm zero import AND zero `styles.` before deleting.
- [x] 1.2 Candidates (confirm via 1.1; preliminary list): `medical_documents/components/modals/{RequirementFeedback,StatusActionModal,MedicalActionModals,EditLicenseModal}.module.css`; `…/forms/{PrescriptionForm,SimpleRequestForm}.module.css`; `…/lists/{RequirementMedicationList,MedicalRequirementTable,MedicalRequirementRecycleBin}.module.css`; `institutions/components/forms/InstitutionFormModal.module.css`; `config/components/ui/ConfigToggle.module.css`; `config/components/sections/{IntegrationSettings,IntegrationGoogleCalendar}.module.css`; `chat/components/ui/{ChatMessageBubble,ChatList,ChatConversationItem}.module.css`; `chat/components/sections/ChatThread.module.css`; `auth/{RegisterPage,AuthContext}.module.css`; `appointments/components/forms/HolidayForm.module.css`.
- [x] 1.3 DELETE each confirmed-orphan file; `pnpm build` to prove no dangling imports.
- [x] 1.4 Gate: `pnpm lint`; remaining 1-line `.module.css` count = 0.

## Phase 2: Enforce named exports + BEM (no new deps)

- [x] 2.1 Verify: no core rule/plugin bans default export; `react-refresh/only-export-components` does not forbid it.
- [x] 2.2 Add `no-restricted-syntax` selector `ExportDefaultDeclaration` → "use named exports" in `client/eslint.config.js`; keep `warn` while migrating, flip to `error` in Phase 5.
- [x] 2.3 Configure existing `stylelint-selector-bem-pattern` in `client/.stylelintrc.json` (componentName/componentSelectors) so BEM preset actually enforces; verify `pnpm lint`.
- [x] 2.4 Gate: `pnpm lint` fires rule but does not break build for migrated files.

## Phase 3: Named-exports migration (smallest → largest), one PR each

Per PR: convert `export default` → `export const` per JSX, update ALL importers, then `pnpm build` + `pnpm lint`.

- [x] 3.1 holidays (1); 3.2 rentals (1); 3.3 insurances (3)
- [x] 3.4 layout, dashboard, whatsapp (3–4); - [x] 3.5 users (communication skip: 0); 
- [x] 3.6 institutions (6); - [ ] 3.7 outreach (8)
- [x] 3.8 auth, chat (9); - [x] 3.9 doctors, reports (11)
- [ ] 3.10 config (14); 3.11 finances (25)
- [ ] 3.12 patients (27); 3.13 medical_documents (40)
- [ ] 3.14 appointments (41)

## Phase 4: BEM fixes in migrated features

Rename flat classes to `block__element--modifier` in each feature's `.module.css`, update JSX classNames; gate `pnpm build` + `pnpm lint`.

- [ ] 4.1 groups 3.1–3.3; 4.2 groups 3.4–3.5
- [ ] 4.3 groups 3.6–3.8; 4.4 groups 3.9–3.10
- [ ] 4.5 groups 3.11–3.12; 4.6 groups 3.13–3.14

## Phase 5: Final verification

- [ ] 5.1 Flip `ExportDefaultDeclaration`/BEM rules to `error`; full-repo `pnpm lint` + `pnpm build`.
- [ ] 5.2 Confirm success criteria: 0 orphaned 1-line CSS, `export default` ≈ 0 migrated, all classes BEM.