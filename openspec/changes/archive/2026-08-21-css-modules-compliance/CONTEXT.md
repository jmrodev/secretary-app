# Contexto: compliance de `ARQUITECTURA.md` — Secretary App (`css-modules-compliance`)

> Documento de contexto para herramientas externas (p. ej. Antigravity). Explica qué se está haciendo, qué falta para cumplir 100% `ARQUITECTURA.md` §2, y qué herramientas Gentle AI usar.

## 1. Qué estamos haciendo

Corregir la contradicción entre **`docs/ARQUITECTURA.md` §2** (exige *"exclusivamente CSS Modules (`styles.module.css`) para todos los componentes de React"*) y la realidad del código: hay clases BEM **globales** usadas como strings en JSX (`className="config-section"`, `config-grid`, `tab-panel`, `action-bar`, `search-box*`, `user-table__header`, `text-danger`, `animate-fade-in`). GGA (pre-commit) las marca como error.

Además el working tree estaba mezclado (WIP de 3 feature branches → 79 archivos sucios en `development`), así que el trabajo se está desenredando en ramas limpias vía **SDD**.

**Cambio SDD:** `css-modules-compliance`. Plan: crear `client/src/styles/shared.module.css` (PascalCase BEM, tokens de `variables.css`) y migrar todos los usos globales a ese módulo; luego borrar las reglas de los global stylesheets.

**División en slices** (`auto-chain` / `feature-branch-chain`):
- **Slice 1** (casi listo): `shared.module.css` + 8 archivos de config/settings. Código verificado (lint 0 / build 0 / grep BEM global = 0). Commit 2 bloqueado por GGA (provider caído) → autorizado `--no-verify`.
- **Slice 2:** users (`UserManagement`, `UserTable`, `SearchBar`).
- **Slice 3:** resto de `animate-fade-in` (`PageHeader`, `MainLayout`, `InstitutionSelector`, `FeatureToolbar`, `PatientDetailsView`, `PatientPrintableView`, `UserForm`, `PatientRecycleBin`, `MessageTemplateEditor`, `ErrorBoundary`).
- **Slice 4:** limpieza de global stylesheets (`components.css` L45-100, `utilities.css`, `layout-dashboard.css`).

**Fuera de slice 1** (`BillingSettings.jsx` usa otra familia BEM: `config-group*`, `config-status*`, `config-field*`, `config-actions*`, `config-link`) → va en su propio slice.

## 2. Qué falta para cumplir 100% `ARQUITECTURA.md` §2

- [ ] Completar slices 2, 3 y 4 (users, animate rest, cleanup global).
- [ ] Llevar a **0** todo BEM global en JSX:
  `grep -rnE 'className="(config-section|config-grid|tab-panel|action-bar|search-box|user-table__header|text-danger|animate-fade-in)"' client/src` → debe dar 0.
- [ ] Borrar las reglas migradas de `components.css` / `utilities.css` / `layout-dashboard.css`.
- [ ] Migrar también `BillingSettings` y cualquier componente con familias BEM distintas.
- [ ] **i18n:** todo texto visible por `t('key')` (hay gaps conocidos en `GeneralSettings` y keys de `general.js`).
- [ ] **Atomic design / exports nombrados / Context API** para estado compartido (resto de reglas de §2).
- [ ] Pasar GGA + lint + build + review en cada slice.

## 3. Herramientas Gentle AI a usar

- `gentle-ai sdd-status --cwd <repo>` — estado del cambio SDD.
- `gentle-ai sdd-continue <change> --cwd <repo>` — avanzar fases (verify/archive) tras apply.
- `gentle-ai sdd-apply` — implementar tasks (⚠️ en este entorno el agente `sdd-apply` devuelve vacío → bypass con agente `general`).
- `gentle-ai sdd-verify <change>` — validar implementación vs specs.
- `gentle-ai sdd-archive <change>` — cerrar y persistir delta specs.
- `gentle-ai sdd-attempt acquire / settle / rescope --cwd <repo>` — autoridad de intentos (budget/attempts del runtime).
- `gentle-ai review status --cwd <repo> --contract gentle-ai.review-integration/v2 --agent opencode --next-transition` — lifecycle de review (gate de entrega).
- `gentle-ai review mode enable | disable | status` — kill switch de receipt-driven development.
- `gentle-ai codegraph init --cwd <repo>` — análisis estructural de símbolos/dependencias.
- **Skills:** `rdd-defect-workflow`, `chained-pr`, `branch-pr`, `judgment-day`.

## 4. Bloqueos conocidos

- **GGA provider caído** (opencode review → `Unexpected server error`, no es código). Autorizado `--no-verify` para slice 1.
- **Agente `sdd-apply` roto** (transporte vacío) → se usa agente `general` como bypass.
- **WIP de features** en `stash@{0}`; `development` limpio en `a2b9ca72`.
