# Tasks: CSS Architecture Remediation — Doctor Schedule Settings Tab

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~265 (add ~72 / del ~162) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Full remediation (6 files) | PR 1 | `pnpm --filter server test` + greps | `pnpm --filter client dev`, toggle themes, resize 375/768/1024 | `git revert` — 6 files, no DB |

## Phase 1: Tokens — `variables.css`

- [ ] 1.1 Add 14 `--schedule-*` tokens to `:root` as `var(--...)` refs, `hover-bg: var(--row-hover-bg)` (errata 6)
- [ ] 1.2 Add same 14 refs to `[data-theme="light"]` and `[data-theme="dim"]` — Dep: 1.1

## Phase 2: ScheduleBulkActions

- [ ] 2.1 Replace `var(--gray-900)`→`var(--schedule-container-bg)` L5, remove `animation: fade-in-up` L9 (errata 4) — Dep: Phase 1
- [ ] 2.2 MQ: move column/stretch to base, add `@media (min-width:769px)` row/center (errata 5) — Dep: 2.1

## Phase 3: ScheduleTimeBlock

- [ ] 3.1 Rename `__typeSelectVirtual`→`__typeSelect--virtual` L49, replace `rgb(128,128,128,.08)`→`var(--schedule-block-hover-bg)` L20, remove `!important` L95-96 — Dep: Phase 1
- [ ] 3.2 MQ: move column/hidden to base, add `@media (min-width:641px)` row/block; keep `@keyframes fade-in-up` — Dep: 3.1

## Phase 4: DoctorScheduleSettings (~134 lines dead, errata 1)

- [ ] 4.1 Remove local tokens L4-12, use `variables.css` tokens — Dep: Phase 1
- [ ] 4.2 Delete 19 dead selectors (~134 lines): L46-53,55-60,62-90,155-240 — keep 14 used classes — Dep: 4.1
- [ ] 4.3 BEM `__scheduleDayActive`→`__scheduleDay--active` L102/138, delete `__typeSelectVirtual` L198 (errata 3), fix divider MQ base `none` + `@media(min-width:641px) block` — Dep: 4.2

## Phase 5: JSX — sync BEM (after CSS)

- [ ] 5.1 `DoctorScheduleSettings.jsx:146` `__scheduleDayActive`→`__scheduleDay--active` — Dep: Phase 4
- [ ] 5.2 `ScheduleTimeBlock.jsx:47` `__typeSelectVirtual`→`__typeSelect--virtual` (errata 2) — Dep: Phase 3

## Phase 6: Verify

- [ ] 6.1 `pnpm --filter server test` passes — REQ-HYG-2 — Dep: Phase 5
- [ ] 6.2 Greps →0: `!important`, `__scheduleDayActive`, `__typeSelectVirtual`, `white|gray-900|rgb(` in 4 CSS
- [ ] 6.3 Manual: `pnpm --filter client dev`, toggle dark/light/dim, resize 375/768/≥769/1024 — Scenarios 1/2/3/7
- [ ] 6.4 `pnpm build && pnpm lint` — Dep: 6.1

## Dependencies

Phase 1 → Phase 2 & 3 (parallel) → Phase 4 → Phase 5 → Phase 6. Critical: 1.1→1.2→4.1→4.2→4.3→5.1→6.1

## Test Commands

- `grep -c "schedule-" client/src/styles/variables.css` ≥42; `grep -rn '!important\|__scheduleDayActive' client/src/` →0; `pnpm --filter server test`

## Workload Detail

| Phase | + | - | Net |
|-------|---|---|-----|
| 1 Tokens | 42 | 0 | +42 |
| 2 BulkActions | 6 | 8 | -2 |
| 3 TimeBlock | 12 | 8 | +4 |
| 4 Settings | 10 | 144 | -134 |
| 5 JSX | 2 | 2 | 0 |
| Total | 72 | 162 | 265 <400 Low risk, single PR |
