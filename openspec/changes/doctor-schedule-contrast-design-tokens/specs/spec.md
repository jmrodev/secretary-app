# Specification: Doctor Schedule Contrast & Design Tokens Overhaul

## Requirements

### 1. Contrast & Accessibility
- In `DoctorEditModal.module.css`:
  - Duration grid and overturn section must use `--card-surface-bg` (or `var(--dashboard-card-bg)`), with a distinct border `1px solid var(--border-color)` and subtle shadow `var(--shadow-sm)`.
  - Headers must use `var(--text-main)` or `var(--primary-color)` with appropriate font-weight.
  - Help text must use `var(--text-muted)` with legible contrast ratio against `--modal-bg` and `--card-surface-bg`.

### 2. Semantic Token Binding in `DoctorScheduleSettings.module.css`
- All component-level tokens MUST derive from core tokens:
  - `--schedule-container-bg: var(--card-surface-bg, var(--dashboard-card-bg));`
  - `--schedule-container-border: var(--border-color);`
  - `--schedule-day-inactive-bg: var(--card-hover-bg, rgba(255, 255, 255, 0.03));`
  - `--schedule-day-active-bg: var(--dashboard-card-bg);`
  - `--schedule-day-border: var(--border-color);`
  - `--schedule-day-active-border: var(--primary-color);`
- Replace hardcoded `background-color: white;` in inputs/selects with theme tokens (`var(--dashboard-card-bg)`, `var(--text-main)`, `var(--border-color)`).
- Time inputs, bulk action cards, and day cards must be visually crisp and readable across themes.

### 3. Spacing & Layout Standards
- Margins and paddings MUST utilize `--spacing-xs`, `--spacing-sm`, `--spacing-md`, `--spacing-lg`.
- Gaps in flex and grid containers MUST use `--spacing-*` tokens.
