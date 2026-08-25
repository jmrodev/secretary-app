# Design: Page Skeleton Unification

## Overview
The goal is to unify the layout structure across all pages by centralizing the main content wrapper and animation logic within the `MainLayout` component. This prevents duplicated boilerplate code, standardizes the layout-content-area and animations, and ensures HTML semantic correctness.

## 1. MainLayout Updates
Target File: `client/src/components/templates/MainLayout.jsx` and `client/src/components/templates/MainLayout.module.css`

### Architecture Changes:
- **Wrapper Renaming**: Rename the inner content wrapper class from `.inner` to `.pageShell` in the CSS module to better represent its role.
- **HTML Structure**: Ensure the `MainLayout` component renders a single `<main>` element as the primary content container.
- **Class Application**: Apply standard classes `layout-content-area` and `animate-fade-in` directly to the `<main>` wrapper or its `.pageShell` container.
- **Opt-out Mechanism**: Introduce a `noAnimation` boolean prop. When `true`, dynamically omit the `animate-fade-in` class from the content wrapper.
- **Spacing**: Ensure `MainLayout` manages the vertical and horizontal spacing using design system tokens.

## 2. Page Components Refactoring
Target Files: ~17 `*Page.jsx` components across the `client/src/pages/` directory and their respective `*Page.module.css` files.

### Refactoring Pattern:
- **Remove Outer Wrappers**: Strip out any outer `<div>` or `<main>` tags that serve only as page-level wrappers from the `return` statement of the page components.
- **Semantic Tags**: Ensure the root element of each page component is a semantic tag like `<section>`, `<article>`, or a standard `<div>`, rather than `<main>` (to avoid nested `<main>` elements when rendered inside `MainLayout`).
- **Remove Orchestrator Classes**: Delete any CSS classes mimicking the layout orchestrator or page wrapper behavior (e.g., `*pageOrchestrator`, `.pageWrapper`, `.mainContent`) from the `className` props in the JSX.
- **Clean CSS Modules**: Remove the orphaned classes from the corresponding `*Page.module.css` files.

## Component Interactions
1. Routing renders a specific `*Page` component.
2. The `*Page` component is wrapped by `MainLayout` (either at the router level or within the page itself).
3. `MainLayout` renders the global header/sidebar, then renders its `<main>` content area.
4. The `<main>` area handles the fade-in animation (unless opted out) and spatial boundaries.
5. The `*Page` component directly mounts its core semantic content inside the `<main>` area.
