# Spec: Schedule Accessibility

## Purpose

Defines required contrast and native-control visibility for the doctor schedule editor so the active/inactive day state and time inputs are usable in dark, dim, and light themes, and so `DoctorScheduleSettings` never throws on a missing `setSchedule` prop.

## Requirements

### Requirement 1: Active Day Contrast Differentiation

The `DoctorScheduleSettings` day rows MUST render an active state clearly distinguishable from the inactive state across `data-theme="dark"`, `data-theme="dim"`, and `data-theme="light"`.
- Active day background tint MUST use a primary-color alpha of at least `0.16` in dark and dim themes (`--schedule-day-active-bg`).
- Active day MUST display a visible `2px` primary-color border (`--schedule-day-active-border`).
- Inactive day rows MUST NOT be rendered with `opacity: 0.75` (the wash that made rows look disabled); they MUST use a solid surface background instead.
- `ScheduleTimeBlock` containers MUST use the dedicated schedule block token (not `--dashboard-card-bg`) so block cards do not collide in luminance with the active day row.

#### Scenario: Active day is perceptibly distinct from inactive in dark/dim
- GIVEN a doctor schedule rendered with one or more active days
- WHEN the day rows paint under `data-theme="dark"` or `data-theme="dim"`
- THEN the active day shows a teal tint ≥0.16 alpha plus a 2px teal border, and no row uses `opacity:0.75`.

#### Scenario: Light theme keeps readable text after tint increase
- GIVEN the app rendered under `data-theme="light"`
- WHEN the schedule day active background increases to ≤0.12 alpha
- THEN `--text-main` text on the active day MUST remain at WCAG AA contrast (≥4.5:1).

#### Scenario: Time block cards do not blend into active day
- GIVEN an active schedule day containing `ScheduleTimeBlock` cards
- WHEN the cards and the day row render
- THEN the block container uses the dedicated schedule-block token, producing a visible luminance gap from the day row.

---

### Requirement 2: Native Time Input Visibility in Dark/Dim

The `Input` atom (`type="time"`) MUST expose a visible native picker indicator and editable subfields in dark and dim themes.
- `Input__root` MUST declare `color-scheme: dark` under `data-theme="dark"` and `data-theme="dim"` so the UA renders native controls with a dark palette.
- Under dark/dim themes the `::-webkit-calendar-picker-indicator` (clock icon) MUST be inverted (`filter: invert(0.7)` or equivalent) so it is not dark-on-dark.

#### Scenario: Clock icon visible on dark/dim time inputs
- GIVEN a `ScheduleTimeBlock` time `Input` under `data-theme="dark"` (or `dim`)
- WHEN the user views the time field
- THEN the clock indicator is visible (inverted) and the native picker popover renders with a dark palette.

#### Scenario: Time inputs unaffected in light theme
- GIVEN the app under `data-theme="light"`
- WHEN a `type="time"` input renders
- THEN `color-scheme` resolves to `light` and the picker indicator shows its default light-style icon.

---

### Requirement 3: Defensive `setSchedule` Default

`DoctorScheduleSettings` MUST NOT throw when `setSchedule` is omitted from props.
- `setSchedule` MUST default to a no-op (`() => {}`) parameter so ad-hoc renders (tests, stories, billing-launched modal) never call an undefined function.
- All internal mutation helpers (`toggleDay`, `handleAddBlock`, `handleBlockChange`) MUST continue using the functional-updater form `setSchedule(prev => ...)`.

#### Scenario: Renders without setSchedule prop
- GIVEN `DoctorScheduleSettings` mounted without a `setSchedule` prop (e.g., storybook or billing-launched modal)
- WHEN the component renders and the user interacts with a day toggle or block field
- THEN no `TypeError: setSchedule is not a function` is thrown; interactions are safely ignored.

#### Scenario: Functional updater preserved when setSchedule provided
- GIVEN `DoctorScheduleSettings` mounted with a real `setSchedule` from the doctors controller
- WHEN a day block is toggled or edited
- THEN `setSchedule` is invoked with a functional updater `(prev) => next` preserving prior schedule state.
