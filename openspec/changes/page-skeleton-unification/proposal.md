<Proposal: page-skeleton-unification>
## Intent
The application suffers from inconsistent page layouts: chaotic `<main>` placement, fragmented CSS classes, and dead wrapper elements. Pages do not trust the canonical `.inner` wrapper, leading to duplicated styles and invalid HTML (`<main>` inside `<main>`). Unifying the page skeleton will eliminate redundancy and simplify future layout changes.

## Scope

### In Scope
- Refactoring `MainLayout` to absorb standard wrapper behaviors (`layout-content-area`, `animate-fade-in`).
- Removing redundant wrapper elements (`<div>` and `<main>`) from all 17+ page components.
- Fixing invalid nested `<main>` HTML structure.
- Cleaning up orphaned per-page CSS module classes.

### Out of Scope
- Redesigning internal page layouts.
- Rewriting global CSS variables or overall design system.

## Capabilities

### New Capabilities
- `page-shell-standardization`: `MainLayout` natively handles consistent spacing and fade-in animations for all pages, exposing opt-out props when needed.

### Modified Capabilities
- `page-rendering`: Page components are flattened, directly returning their core content rather than repeating boilerplate orchestrator wrappers.

## Approach
Absorb the shell into `MainLayout`. Rename the `.inner` container to `.pageShell` and add `animate-fade-in` and `layout-content-area` behavior by default (with an opt-out prop). Update all 17+ page components to strip their outermost orchestrator `<div>` or `<main>` tags. Because `MainLayout` already provides a `<main>` tag, pages will provide structural `<section>` or `<div>` children, resolving the invalid `<main>` inside `<main>` HTML issue.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `MainLayout.jsx` | Modified | Absorb shell behaviors, rename `.inner` to `.pageShell`. |
| `MainLayout.module.css` | Modified | Update `.inner` rules to `.pageShell`. |
| `*Page.jsx` (17+ pages) | Modified | Remove outermost orchestrator wrappers and `<main>` tags. |
| `*.module.css` | Modified | Remove orphaned `root` and `orchestrator` classes. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Layout regressions in custom pages (`HolidaysPage`, `WhatsappPage`) | Medium | Manual audit of pages without shared CSS modules. |
| `ChatPage` layout breaking | High | Specifically test ChatPage's 3-level nesting removal; retain necessary structural elements. |
| Missing print styles (`MedicalDocumentsPage`) | Low | Move `noPrint` class to a remaining visible node. |

## Rollback Plan
Revert the Git commit containing the layout and page component changes.

## Dependencies
- None

## Success Criteria
- [ ] Zero redundant `*pageOrchestrator` wrapper divs in page components.
- [ ] Zero nested `<main>` tags in the DOM.
- [ ] Consistent `animate-fade-in` behavior across all standard pages.
</Proposal: page-skeleton-unification>
