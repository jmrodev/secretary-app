# Design: System Modules Settings Tab

## Architecture Overview
The system configuration feature in `client/src/features/config/` utilizes a decoupled registry/slot pattern (`configRegistry.js` + `ConfigRegistryLoader.jsx` + `SystemConfigPage.jsx`).

```
[SystemConfigPage]
       │
       ▼
[FeatureToolbar] (Tabs: General, Modules, Profile, Communications, Integrations, Institutions, Billing, Logs)
       │
       ▼
[SettingsContent] (Lazy loads active section from registry Map)
       ├── GeneralSettingsWrapper -> <GeneralSettings /> (URLs, QR, APK)
       ├── ModulesSettingsWrapper -> <ModulesSettings /> (Minimalist card grid for feature toggles)
       └── ...
```

## Component Architecture (Atomic Design)
- **Organism**: `ModulesSettings.jsx`
- **Molecules**: Module toggle cards (`.ModulesSettings__card`) with Icon, Title, Description, and `ConfigToggle`.
- **Atoms**: `ConfigToggle`, `Icon`.
- **Styling**: `ModulesSettings.module.css` following BEM methodology and CSS design tokens from `variables.css`.

## Data Flow
1. `useSystemConfigController` provides `user`, `settings`, and `handlers.updateSetting`.
2. When the toggle is modified, `updateSetting('enable_office_rentals', value)` dispatches `POST /api/settings` to persist the state in `system_settings`.
3. `ConfigContext` updates in real-time, instantly reflecting in `Navbar` (showing/hiding `/rentals`) and `DoctorTariffsForm`.
