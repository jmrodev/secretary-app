# Design: Frontend Style Unification (Phases 2–5)

## Technical Approach

Mechanical, staged refactor of `client/` (React 19, CSS Modules, Atomic Design); zero product-behavior change. Phase 1 (orphan CSS purge, PR #343) is merged. This design covers: Phase 2 — lint gates (ESLint named-exports selector + Stylelint BEM enforcement); Phase 3 — migrate 196 feature files from `export default` to named exports; Phase 4 — normalize classes to BEM; Phase 5 — flip gates to `error` and convert the 42 non-feature default-export files. Server TDD is N/A (tasks.md); gates are `pnpm lint` + `pnpm build`.

## Architecture Decisions

### D1 — ESLint named-exports gate (`client/eslint.config.js`)
| Option | Tradeoff | Decision |
|---|---|---|
| Per-selector severity (`ExportDefaultDeclaration` = warn, others = error) | **Not supported**: `no-restricted-syntax` has ONE rule-level severity (verified ESLint 10.2.1 docs + current config) | Rejected |
| Separate plugin/rule | Unjustified dependency | Rejected |
| Rule-level `warn` during migration, `error` in Phase 5 | Existing 2 selectors temporarily downgraded | **Chosen** |

**Rationale**: the rule is currently `'error'`; the only way to satisfy the spec's "warn during migration, must not fail `pnpm lint`" is to drop the whole rule to `'warn'` (Phase 2) and restore `'error'` in Phase 5.

```js
// client/eslint.config.js — Phase 2 state. Phase 5: first item 'warn' → 'error'.
'no-restricted-syntax': [
  'warn',
  {
    selector: "Identifier[name=/^(handleClick|handleChange|handleEvent)$/]",
    message: "Use semantic handler names (e.g., handleSavePatient) instead of generic names like handleClick.",
  },
  {
    selector: "JSXText[value=/\\.{3}/]",
    message: "Use the real ellipsis character (…) instead of three dots (...).",
  },
  {
    selector: 'ExportDefaultDeclaration',
    message: 'Use named exports (export const / export function) instead of export default.',
  },
],
```

### D2 — Stylelint BEM enforcement (`client/.stylelintrc.json`)
| Option | Tradeoff | Decision |
|---|---|---|
| Re-enable `selector-class-pattern` | Standard preset default is kebab-case → flags all camelCase classes; wrong tool | Rejected |
| Keep preset-only (status quo) | Plugin is a **no-op**: `findRanges` never fires because `implicitComponents` is unset (spec's `selector-class-pattern: null` diagnosis is inaccurate) | Rejected |
| `implicitComponents` + `componentName` + `componentSelectors`, severity `warning` | Flags ~1,900 flat classes repo-wide at warn during migration (intended Phase 4 signal) | **Chosen** |

**Rationale**: all 206 module basenames match `^[A-Z][a-zA-Z0-9]*$` (verified: zero exceptions), so no "invalid component name" errors. Scoping `implicitComponents` to `**/*.module.css` keeps the 12 global CSS files exempt. Keep `selector-class-pattern: null` (camelCase BEM elements contradict its kebab default). Target convention: `Block__element--modifier`, block = PascalCase module basename, element/modifier camelCase (matches existing repo style, minimal churn — existing classes are flat camelCase like `.root`, `.dayCell.selected`, `.pendingClosuresContainer`).

```json
// client/.stylelintrc.json — Phase 2 state. All other rules unchanged.
// Phase 5: drop the secondary object (default severity is "error").
"plugin/selector-bem-pattern": [
  {
    "preset": "bem",
    "componentName": "^[A-Z][a-zA-Z0-9]*$",
    "componentSelectors": "^\\.{componentName}(?:__[a-zA-Z0-9]+)?(?:--[a-zA-Z0-9]+)?$",
    "implicitComponents": "**/*.module.css"
  },
  { "severity": "warning" }
]
```

### D3 — Migration mechanics (Phase 3)
- **Order**: tasks.md grouping, smallest → largest. Live counts differ from the tasks.md audit — apply re-derives per PR with `rg -l 'export default' src/features/<group> -g '*.jsx' -g '*.js'`. Verified: holidays 0, communication 0, outreach 0 (already migrated → skip); live counts: rentals 1, insurances 3, layout 3, dashboard 4, whatsapp 2, users 5, institutions 6, auth 8, chat 9, doctors 10, reports 11, config 12, finances 23, patients 24, appointments 36, medical_documents 39.
- **Conversion**: `export default Foo` → `export const Foo = …` / `export function Foo(…)` (named export keeps the component name).
- **Importer update** (per module): `rg -l "<ComponentName>" client/src -g '*.jsx' -g '*.js'` → update every `import X from '…'` to `import { X } from '…'`; then update the feature's `index.js` barrel: `export { default as X } from '…'` → `export { X } from '…'` (16 barrels repo-wide affected).
- **Mixed component+hook files**: `react-refresh/only-export-components` is already `'warn'` with `allowExportNames: ['useAuth', 'useConfig', 'useLanguage', 'useMessage', 'useModal']`. Per PR, run `rg '^export (function|const) use[A-Z]' client/src -g '*.jsx'` and add discovered hooks (e.g. `useAppointmentsPageController`, `useDayScheduleController`, `useAgendaModals`) to `allowExportNames` in the same PR. `hooks/*.js` files (65) export no components — rule does not apply.

### D4 — BEM fixes (Phase 4)
- **One PR per feature unit carries both migration AND BEM** (spec: CSS + JSX in the same PR; matches tasks.md forecast "1 PR per feature (migration+BEM)").
- **Rename strategy**: 1:1 prefix — flat class `x` → `Block__x` (Block = module basename, e.g. `dayCell` → `Calendar__dayCell`); state classes (`.selected`, `.active`, `.today`) → `Block__element--state`; every token in grouped (`.calendarLoader, .calendarEmpty`) and descendant (`.dayCell.past .number` → `.Block__dayCell--past .Block__number`) selectors renamed independently; nested/combined sequences keep the same block.
- **JSX**: every `styles.x` → `styles.Block__x` in the same PR (`rg -l 'styles\.' <feature>`); `pnpm build` catches dangling references.

### D5 — Phase 5 final gate
- Convert the **42 non-feature** default-export files (`components/`, `routes/`, `api/`, `App.jsx` — verified; repo-wide `error` rule would otherwise fail full lint) in the same final PR as the flips.
- Flip: eslint `'warn'` → `'error'`; stylelint drop `{ "severity": "warning" }` (defaults to `error`).
- Gate: `pnpm lint` exit 0; `pnpm build` exit 0; `rg "export default" client/src` → 0.

## Data Flow — per work unit

```
branch off updated development
  ├─ convert exports → named      ├─ rg importers → named imports
  ├─ update index.js barrel       ├─ BEM renames + styles.* JSX updates
  ├─ extend allowExportNames      ├─ rg "export default" <group> = 0
  └─ pnpm lint (warn OK) → pnpm build → gh pr create --base development → merge
       └─ next branch cut from updated development (sequential — avoids import-graph conflicts)
```

## File Changes

| File | Action | Description |
|---|---|---|
| `client/eslint.config.js` | Modify | 3rd `no-restricted-syntax` selector; severity warn→error (D1) |
| `client/.stylelintrc.json` | Modify | BEM plugin config (D2) |
| `client/src/features/**` (196 jsx/js) | Modify | Named exports + `styles.*` class updates |
| 16 feature `index.js` barrels | Modify | Named re-exports |
| `client/src/components|routes|api`, `App.jsx` (42) | Modify | Named exports (Phase 5) |
| `client/src/features/**/*.module.css` (206) | Modify | BEM class renames |

## Testing Strategy

| Layer | Approach |
|---|---|
| Unit/Integration/E2E | N/A — style refactor, no logic change (server TDD N/A per tasks.md) |
| Per-PR gates | `rg "export default" src/features/<group>` = 0; `rg -n "default as|export \{ default" <group>/index.js` = 0; `pnpm lint` (warnings allowed); `pnpm build` |
| Phase 5 | `pnpm lint` exit 0; `pnpm build` exit 0; `rg "export default" client/src` = 0 |

## Threat Matrix

VCS/PR automation is part of delivery (branching, `gh` PRs), so the matrix applies.

| Boundary | Applicability | Design response / expected safe vs failure behavior |
|---|---|---|
| Documentation-like paths | N/A — no executable docs | — |
| Git repo selection | Applicable | Resolve root via `git rev-parse --show-toplevel`; assert it equals `/home/jmro/secretary-app`; never `git -C` into user paths. Fail → abort before any branch work. |
| Commit state | Applicable | `git add <explicit unit paths>` only; never `-A`/`-a`; pre-check `git status --short`. Fail → abort on unexpected staged/modified files. |
| Push state | Applicable | `git push -u origin <fixed-branch>`; never force-push. Fail → abort and rebase onto updated `development` if rejected. |
| PR commands | Applicable | `gh pr create --base development --head <fixed-branch> --title --body`; `gh pr merge --squash --delete-branch`; fixed branch names only (no composed/user interpolation); verify PR diff ≤ 400 lines before merge. Fail → abort if diff exceeds budget or targets wrong base. |

Per-PR pre-flight RED checks for the applicable rows propagate to tasks: root assertion, clean-status assertion, branch-name assertion, diff-size assertion.

## Migration / Rollout

Sequential feature-branch chain; `development` (protected) is the only merge base; each PR merged with `gh pr merge --squash --delete-branch`; next branch cut after merge.

| Work unit (tasks.md) | Branch | Content | Gate |
|---|---|---|---|
| Phase 2 (2.2–2.3) | `style/lint-gates` | eslint + stylelint config | `pnpm lint` |
| 3.1 holidays | skip — live count 0 | verify, mark done | — |
| 3.2 rentals | `style/rentals` | migration + BEM | rg + lint + build |
| 3.3 insurances | `style/insurances` | migration + BEM | rg + lint + build |
| 3.4 layout+dashboard+whatsapp | `style/layout-dashboard-whatsapp` | migration + BEM | rg + lint + build |
| 3.5 users (communication skip) | `style/users` | migration + BEM | rg + lint + build |
| 3.6 institutions | `style/institutions` | migration + BEM | rg + lint + build |
| 3.7 outreach | skip — live count 0 | verify, mark done | — |
| 3.8 auth+chat | `style/auth-chat` | migration + BEM | rg + lint + build |
| 3.9 doctors+reports | `style/doctors-reports` | migration + BEM | rg + lint + build |
| 3.10 config | `style/config` | migration + BEM | rg + lint + build |
| 3.11 finances | `style/finances` | migration + BEM | rg + lint + build |
| 3.12 patients | `style/patients` | migration + BEM | rg + lint + build |
| 3.13 medical_documents | `style/medical-documents` | migration + BEM | rg + lint + build |
| 3.14 appointments | `style/appointments` | migration + BEM | rg + lint + build |
| Phase 5 (5.1–5.2) | `style/final-gate` | 42 non-feature conversions + flip to `error` | full gate |

## Open Questions

None blocking. Note for review: converting 42 non-feature files exceeds the proposal's `features/*`-only scope, but is mandatory — the Phase 5 `error` rule lints the whole `client/` and would otherwise fail the full-repo gate.

> DECISION (user-confirmed 2026-08-14): proposal items "enforce `t()` for visible text; allow inline styles only for dynamic values" are **postponed to a separate change**, out of this delta. Covered here: named-exports and BEM only.
