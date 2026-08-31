# Tasks: Doctor Schedule Contrast & Design Tokens Overhaul

## Phase 1: CSS Refactor
- [x] 1.1 Overhaul `DoctorEditModal.module.css` schedule tab styles to eliminate low-contrast hardcoded blue tints and integrate semantic tokens (`--card-surface-bg`, `--border-color`, `--text-main`, `--text-muted`).
- [x] 1.2 Overhaul `DoctorScheduleSettings.module.css` local tokens and classes to derive from `--card-surface-bg`, `--dashboard-card-bg`, `--primary-color`, and `--border-color`.

## Phase 2: Verification
- [x] 2.1 Verify styling across CSS modules with linter / tests.
- [x] 2.2 Run client test suite (`pnpm --filter client test -- --run`).
