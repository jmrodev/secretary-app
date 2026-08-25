# Specification: Page Skeleton Unification

## Capabilities

### 1. page-shell-standardization

**Description:** `MainLayout` natively handles consistent spacing and fade-in animations for all pages, exposing opt-out props when needed.

#### Requirements
- `MainLayout` MUST render a single `<main>` element that wraps the page content.
- `MainLayout` MUST apply the standard wrapper classes (`layout-content-area`, `animate-fade-in`) to its content area.
- `MainLayout` MUST provide an opt-out prop (e.g., `noAnimation`) which, when true, SHALL disable the default fade-in animation.
- `MainLayout` SHOULD manage standard page spacing dynamically based on the design system.

#### Scenarios

**Scenario: Rendering the default layout**
- **Given** a page component is rendered inside `MainLayout` without any props
- **When** the page loads
- **Then** the page content MUST be wrapped inside a single `<main>` element
- **And** the content area MUST have the `layout-content-area` and `animate-fade-in` CSS classes applied.

**Scenario: Opting out of animations**
- **Given** a page component is rendered inside `MainLayout` with the `noAnimation` prop set to true
- **When** the page loads
- **Then** the page content MUST be wrapped inside a `<main>` element
- **And** the `animate-fade-in` class MUST NOT be present.

### 2. page-rendering

**Description:** Page components are flattened, directly returning their core content rather than repeating boilerplate orchestrator wrappers.

#### Requirements
- Page components MUST NOT use `<main>` as their top-level element to prevent invalid nested `<main>` tags.
- Page components SHOULD use semantic structural elements (such as `<section>`, `<article>`, or `<div>`) as their root elements.
- Page components MUST NOT include redundant wrapper `<div>` elements that solely serve to apply duplicated wrapper classes.
- Orphaned per-page CSS module classes previously used for these wrappers MUST be removed.

#### Scenarios

**Scenario: Rendering a standardized page component**
- **Given** a page component using the unified skeleton
- **When** the component's HTML is generated
- **Then** the top-level element returned by the page MUST NOT be a `<main>` element
- **And** the top-level element MUST NOT contain redundant classes mimicking standard layout behaviors.

**Scenario: Removing redundant wrappers**
- **Given** an existing page component that previously contained a `<main>` or `<div>` wrapper for layout purposes
- **When** the component is refactored for page-skeleton-unification
- **Then** the redundant wrappers MUST be removed from the component
- **And** the component's corresponding CSS module MUST NOT contain the deprecated wrapper classes.
