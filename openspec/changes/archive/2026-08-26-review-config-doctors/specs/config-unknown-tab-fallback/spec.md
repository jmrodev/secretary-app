# Spec: Config Unknown Tab Fallback (NEW)

## Purpose

Ensures `SystemConfigPage` and the config registry surface an explicit, visible state when a requested config `?tab` value is unknown, unregistered, or role-filtered — replacing the silent `return null` blank render and preventing duplicate registry entries under HMR/StrictMode.

## ADDED Requirements

### Requirement 1: Explicit UI for Unknown or Unregistered Config Tab

`SystemConfigPage` MUST render an explicit empty/error state instead of a silent blank (`return null`) when the requested `?tab` value is unknown, unregistered, or not allowed for the current role.
- When `getConfigSection(activeTab)` returns no section (unknown id, or tab filtered out by role), `SystemConfigPage` MUST render a visible "Tab not found" message that includes the offending tab id.
- The `configRegistry.registerConfigSection` function MUST be idempotent: calling it twice with the same id MUST NOT create duplicate entries (guard `if (registry.has(id)) return`).

#### Scenario: Unknown tab query parameter renders fallback UI
- GIVEN an authenticated `admin` or `secretary` user
- WHEN the user navigates to `/config?tab=unknown_value`
- THEN `SystemConfigPage` MUST render a visible "Tab not found" message (not a blank page) and MUST NOT throw.

#### Scenario: Role-filtered tab shows fallback instead of blank
- GIVEN a `secretary` user and a `?tab=modules` URL (`modules` is admin-only)
- WHEN `SystemConfigPage` resolves the section
- THEN the UI shows an explicit unavailable message or redirects to the first allowed tab with a visible notice; it MUST NOT render `null` silently.

#### Scenario: Registry double-registration is idempotent
- GIVEN `configRegistry` has already registered the `billing` section
- WHEN `registerConfigSection('billing', ...)` is called again (e.g., HMR/StrictMode)
- THEN the registry still contains exactly one `billing` entry with no duplicate.
