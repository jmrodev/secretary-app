# Proposal: System Modules Settings Tab ('system-modules-settings-tab')

## Context & Motivation
Currently, the "Enable Office Rentals" (`enable_office_rentals`) toggle is placed inside `GeneralSettings.jsx` alongside networking URLs (Cloudflare tunnel and local LAN IP) and APK download links.

This creates architectural coupling and UX confusion:
1. `GeneralSettings` mixes technical network infrastructure parameters with clinic business feature flags.
2. The office rentals feature flag controls multiple domain areas across the app (Navbar access to `/rentals`, rental tariff configurations in doctor profile forms, and backend auto-cleanup of doctor rental fees when disabled).
3. Storing business module toggles directly inside general network settings limits extensibility for future optional clinic modules (e.g., telemedicine, online payments, patient portal).

## Proposed Solution
1. **Create Minimalist Modules Settings Section (`ModulesSettings.jsx`)**:
   - Create a dedicated, clean, minimalist tab component in `client/src/features/config/components/sections/ModulesSettings.jsx` and its accompanying style sheet `ModulesSettings.module.css`.
   - Use Atomic Design and CSS design tokens (`--dashboard-card-bg`, `--dashboard-card-border`, `--radius-lg`, `--spacing-*`).
   - Isolate the `enable_office_rentals` toggle with an informative description and icon.
2. **Decouple `GeneralSettings.jsx`**:
   - Remove the `enable_office_rentals` toggle from `GeneralSettings.jsx` so it focuses strictly on system network endpoints and mobile app resources.
3. **Register Tab in `ConfigRegistryLoader.jsx`**:
   - Register the new `modules` section in `loadDefaultConfigSections` with proper metadata (`title: t('modules')`, `icon: 'view_module'` / `'domain'`, `desc: t('modules_desc')`).
4. **i18n & Localization**:
   - Add localized keys in English and Spanish dictionaries (`modules`, `modules_desc`, `office_rentals_module`, `office_rentals_module_desc`).

## Impact & Scope
- **Frontend Config Feature**: `client/src/features/config/` (Sections, Registry Loader, Index, CSS Modules).
- **i18n Dictionaries**: `client/src/constants/languages/es/general.js` and `client/src/constants/languages/en/general.js`.
- **Backend / Database**: Zero breaking changes to API contracts or database schema. Reuses the existing `system_settings` key `enable_office_rentals` and `systemSettingsService.updateSetting` endpoint.
