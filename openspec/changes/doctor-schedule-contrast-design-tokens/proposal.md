# Proposal: Doctor Schedule Settings Contrast & Design Tokens Overhaul

## Problem Statement
The Doctor Schedule configuration UI (`DoctorEditModal` schedule tab and `DoctorScheduleSettings`) suffers from severe contrast defects and violations of `AGENTS.md` (Design Tokens and Layout):
1. **Low Contrast & Dark Mode Incompatibility**:
   - Uses hardcoded `rgb(239 246 255 / 20%)` with `var(--blue-800)` / `var(--blue-600)` text, which renders near-invisible dark-blue text over dark modal backgrounds (`--modal-bg`).
   - Uses hardcoded light tokens (`--white`, `--gray-50`, `--gray-200`) in `DoctorScheduleSettings.module.css` rather than dynamic semantic surfaces.
2. **Design Token Deviations**:
   - Uses arbitrary margin/padding values rather than `--spacing-*` tokens.
   - Missing cohesive container styling, clear card hierarchy, and contrast compliance according to WCAG AA / clinical executive palette.

## Proposed Solution
1. **Full Migration to Design Tokens in `DoctorEditModal.module.css`**:
   - Replace arbitrary background and text colors with `--card-surface-bg`, `--border-color`, `--text-main`, `--text-secondary`, `--text-muted`, and `--accent-color`.
   - Ensure high contrast in both Dark and Light themes.
2. **Refactor `DoctorScheduleSettings.module.css`**:
   - Rebind local CSS variables to semantic theme tokens:
     - Container background: `--card-surface-bg` (or `--dashboard-card-bg`).
     - Border: `--border-color`.
     - Inactive day block: `--card-hover-bg` / `--border-color`.
     - Active day block: `--dashboard-card-bg` with `--primary-color` accent border.
     - Text colors: `--text-main`, `--text-secondary`, `--text-muted`.
   - Enforce `--spacing-*` tokens and consistent Flex/Grid layouts.

## Impact & Scope
- `client/src/features/doctors/components/modals/DoctorEditModal.module.css`
- `client/src/features/doctors/components/sections/DoctorScheduleSettings.module.css`
- Visual presentation and accessibility of Doctor Schedule Settings in Dark/Light themes.
