# Tasks: css-modules-compliance

## Scope (full repo)
Convert ALL global BEM usages across client/src to the shared CSS module, and delete the migrated classes from global stylesheets. Fully satisfies ARQUITECTURA.md §2.

## Tasks
- [x] 1. Create client/src/styles/shared.module.css (PascalCase BEM): ConfigSection (+__header/__icon/__title/__desc/__body__divider), ConfigGrid (+--2col/--gap1), TabPanel, ActionBar (+__search/__tools), SearchBox (+__wrapper/__icon/__input/__suggestionIcon/__suggestionStatus), UserTable__header, TextDanger, AnimateFadeIn.
- [x] 2. Convert config/settings sections: WhatsappConfig.jsx, SystemConfigPage.jsx, IntegrationRemoteAccess.jsx, IntegrationMetaWhatsApp.jsx, IntegrationSettings.jsx, IntegrationGoogleCalendar.jsx, GeneralSettings.jsx, CommunicationSettings.jsx, ModulesSettings.jsx.
- [x] 3. Convert users files: UserManagement.jsx, UserTable.jsx, SearchBar.jsx.
- [x] 4. Convert remaining animate-fade-in usages: PageHeader.jsx, MainLayout.jsx, InstitutionSelector.jsx, FeatureToolbar.jsx, PatientDetailsView.jsx, PatientPrintableView.jsx, UserForm.jsx, PatientRecycleBin.jsx, MessageTemplateEditor.jsx, ErrorBoundary.jsx.
- [x] 5. Clean global stylesheets: remove migrated rules from components.css (L45-100), utilities.css (.config-grid, .config-grid--3col, .animate-fade-in, .text-danger), layout-dashboard.css (.animate-fade-in).
- [x] 6. Verify: run GGA pre-commit + pnpm lint + pnpm build; confirm zero global BEM strings remain in JSX.

## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | 600-900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Multiple PRs (auto-chain, feature-branch-chain) |
| Delivery strategy | auto-chain (full-repo >400 lines) |
| Chain strategy | feature-branch-chain |
