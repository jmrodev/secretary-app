# Delta for settings-ui

## Purpose

Bring config settings sections into compliance with AGENTS.md §2.1/2.2 and ARQUITECTURA.md §2 by removing inline styles, undefined/non-semantic design tokens, and BEM bypasses. Pure refactor — no runtime behavior change (NFR-2).

## ADDED Requirements

### Requirement: No inline styles in settings sections

Settings section components MUST NOT contain any `style={{...}}` inline blocks. Every visual rule MUST be expressed via scoped CSS Module classes (BEM) using semantic design tokens.
(Previously: 11 inline blocks existed across 3 section files.)

#### Scenario: BillingSettings renders without inline styles

- GIVEN admin opens Billing tab in any theme
- WHEN page renders
- THEN CSR box, flex justify, and CSR textarea wrapper use CSS Module classes

#### Scenario: IntegrationRemoteAccess renders without inline styles

- GIVEN secretary opens Remote Access tab
- WHEN page renders
- THEN all 8 mobile/icon/url/button inline blocks use CSS Module classes

#### Scenario: IntegrationMetaWhatsApp config-actions

- GIVEN Meta WhatsApp section open
- WHEN config-actions flex renders
- THEN its inline style block is replaced by a CSS Module class

### Requirement: Semantic design tokens only

All settings CSS Modules and extracted styles MUST use defined semantic/scale tokens. The system MUST NOT use `--slate-*`, `--white`, `--green-500/700`, `--red-700`, or hardcoded `rgb(13 148 136 ...)`.
(Previously: those tokens/RGB appeared in BillingSettings.module.css and two RGB sites.)

#### Scenario: ModulesSettings token swap

- GIVEN ModulesSettings.module.css:49
- WHEN built
- THEN `rgb(13 148 136 / 10%)` is `rgb(var(--primary-rgb) / 10%)`

#### Scenario: IntegrationRemoteAccess icon wrapper

- GIVEN remote-access icon wrapper (jsx:149)
- WHEN styled
- THEN uses `rgb(var(--primary-rgb) / 10%)`, not hardcoded RGB

### Requirement: Monospace via ConfigField variant

Monospace inputs in settings sections MUST use `variant="monospace"` on ConfigField. The system MUST NOT apply raw `config-field__input--monospace` class strings.
(Previously: raw class strings at BillingSettings:181, IntegrationMetaWhatsApp:30,42, IntegrationGoogleCalendar:96.)

#### Scenario: Billing CSR textarea monospace

- GIVEN BillingSettings CSR field
- WHEN rendered
- THEN ConfigField has `variant="monospace"`; no raw monospace class

#### Scenario: Meta WhatsApp token fields

- GIVEN Meta WhatsApp token/ID fields
- WHEN rendered
- THEN both use `variant="monospace"`

#### Scenario: Google Calendar field

- GIVEN IntegrationGoogleCalendar field
- WHEN rendered
- THEN uses `variant="monospace"`, no raw class

## REMOVED Requirements

### Requirement: BillingSettings.module.css orphan file

(Reason: all 7 classes unused — no JSX imports the module. Dead code per clarification #1.)
(Migration: the 3 extracted BillingSettings inline styles MUST be hosted in a CSS Module; if the natural host is BillingSettings.module.css, the file is rewritten rather than deleted — see Risk R1.)

### Requirement: IntegrationRemoteAccess.module.css after wiring

(Reason: currently orphaned; after its classes wire the 8 inline styles it becomes dead code, deleted per clarification #5.)
(Migration: wired classes MUST be hosted in a CSS Module imported by the JSX; see Risk R1.)

## NFRs

- NFR-1 Theme parity across dark/light/dim (manual verification)
- NFR-2 Zero runtime behavior change
- NFR-3 No bundle increase
- NFR-4 Consistent BEM + token pattern (ARQUITECTURA.md §2)

## Acceptance Criteria

AC-1 grep `style={{"` empty in sections/ · AC-2 no `--slate-*`/hardcoded RGB in *.module.css · AC-3 grep `config-field__input--monospace` empty · AC-4 BillingSettings.module.css deleted · AC-5 IntegrationRemoteAccess.module.css deleted (JSX classes wired) · AC-6 visual parity 3 themes · AC-7 BEM naming consistent.

## Key Risks (design phase)

R1: AC-4/AC-5 (delete both module files) conflict with FR-1 (extract inline styles to CSS Module classes) — extraction needs a host module. Design MUST decide: (a) create/keep a section module.css (relax literal `file not exists`), or (b) co-locate classes in an adjacent imported module.

R2: `variant="monospace"` emits root class `config-field--monospace`; verify global CSS cascades monospace to the input identically to current raw `config-field__input--monospace` (NFR-1).

R3: Actual inline-style count is 11 (8+2+1), not the 3/4 stated in proposal; AC-1 grep-empty covers all regardless.