# Proposal: Systemic i18n Tech Debt Cleanup (Hooks & Fallbacks)

## Problem Statement
The codebase contains pre-existing systemic i18n technical debt that triggers automated compliance blocks (see Issue #429):
1. **Per-key Fallback Antipattern**: Components frequently use `t('key') || 'Fallback'` because `t(key)` would return raw keys on missing translations.
2. **Hardcoded UI Strings in Client Hooks**: Several controller and handler hooks use hardcoded Spanish strings directly inside `showMessage(...)`, `confirm(...)`, `prompt(...)` and error alerts (e.g. `useWhatsAppUniversal`, `useAppointmentsPageController`, `useDayScheduleHandlers`, `useHolidays`, etc.).

## Proposed Solution
1. **Centralized i18n Fallback Layer**:
   - Extend `t(key, params, fallback)` in `useLanguageLogic.js` to accept an optional fallback or fall back to default Spanish dictionary before returning `key`.
   - Remove redundant `|| 'Fallback'` from components.
2. **Comprehensive Hook Localization**:
   - Inject `useLanguage` into controller and action hooks.
   - Replace hardcoded strings in modal prompts, confirmations, and alerts with proper localized translation keys in `es.js` and `en.js`.

## Impact & Scope
- `client/src/context/useLanguageLogic.js`
- `client/src/constants/languages/es/` and `client/src/constants/languages/en/`
- Controller hooks across appointments, finances, config, rentals, and outreach.
