# Tasks: Systemic i18n Tech Debt Cleanup

## Phase 1: i18n Core Enhancement
- [x] 1.1 Update `client/src/context/useLanguageLogic.js` to support fallback chaining (`currentLang` -> `es` -> `fallback || key`).

## Phase 2: Hook Localization & Translation Keys
- [x] 2.1 Audit and localize `client/src/features/appointments/hooks/useWhatsAppUniversal.js`.
- [x] 2.2 Audit and localize `client/src/features/appointments/hooks/useAppointmentsPageController.js` and `useDayScheduleHandlers.js`.
- [x] 2.3 Audit and localize `client/src/features/appointments/hooks/useHolidays.js`.
- [x] 2.4 Add all corresponding keys to `es` and `en` dictionaries.

## Phase 3: Cleanup & Verification
- [x] 3.1 Clean up `ErrorBoundary.jsx` redundant fallbacks.
- [x] 3.2 Run test suite (`pnpm --filter client test -- --run`).
- [x] 3.3 Run linters and i18n parity checks.
