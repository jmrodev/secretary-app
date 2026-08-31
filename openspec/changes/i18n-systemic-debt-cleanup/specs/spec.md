# Specification: Systemic i18n Tech Debt Cleanup

## Requirements

### 1. Robust Fallback in `t()` Helper
- `t(key, params, fallback)` MUST check the current language dictionary.
- If missing in current language, it MUST check `translations['es'][key]`.
- If still missing, it MUST return `fallback || key`.

### 2. Hook String Externalization
- Every user-facing notification (`showMessage`), confirmation modal (`confirm`), and input dialog (`prompt`) within hooks MUST be invoked with a translation key via `t('key', params)`.
- Translation keys MUST exist in both `es` and `en` dictionaries.

### 3. Cleanup of Raw Inline Fallbacks
- Components using `t('key') || 'Default String'` MUST be simplified to `t('key')` (or `t('key', null, 'Default String')`).
