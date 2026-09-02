# Delta for Frontend Style Unification

## Context

Slice 1 of the CSS module encapsulation / Atomic Design compliance effort. Advances the capability by adding the contract that two targeted medical forms MUST use design-system atoms and MUST NOT import or duplicate atom-level CSS. Pure refactor; no product-behavior change.

## ADDED Requirements

### Requirement: Atom-based form controls

The two target forms SHALL render controls via design-system atoms (`Select`, `Input`, `AutoTextarea`, `Checkbox`) wrapped in the `FormGroup` molecule instead of raw `<select>`/`<input>`/`<textarea>`/`<input type="checkbox">`. Existing prop names, ids, values, and event handlers MUST be preserved.

#### Scenario: PrescriptionItemsList selects become Select atoms

- GIVEN `PrescriptionItemsList` renders the inline form row
- WHEN the 3 raw `<select>` are replaced with `<Select>` atoms
- THEN frequency, units_per_box, and boxes controls render with identical label/value mapping

#### Scenario: PatientMedicationFormModal fields become atoms wrapped in FormGroup

- GIVEN `PatientMedicationFormModal` is open
- WHEN med-name, med-dose, med-frequency, med-boxes, is_chronic, med-notes are rendered
- THEN they use `Input` / `Input type=number` / `Checkbox` / `AutoTextarea` inside `FormGroup`
- AND med-frequency remains a free-text `Input` (no preset `Select`)

### Requirement: Typed Select options arrays

`PrescriptionItemsList` SHALL derive `{label, value}` `options` arrays from `freqPresets`, `[10,14,20,28,30,40,50,60,100]`, and `[1..10]`. The `Select` atom SHALL receive `options`, `size="sm"`, and the existing `controlSm` layout class. The consuming component MUST NOT render inline `<option>` children.

#### Scenario: Frequency options from freqPresets

- GIVEN `freqPresets` prop is present
- WHEN the frequency `Select` options are built
- THEN each option value is the preset index and the label uses the existing translation-key fallback

#### Scenario: Numeric option arrays

- GIVEN the units_per_box and boxes arrays
- WHEN the corresponding `Select` atoms render
- THEN every numeric value appears as a selectable option

### Requirement: CSS module encapsulation

Neither consuming component SHALL import another atom's CSS module (e.g. `@/components/atoms/Input.module.css`) nor replicate atom/`FormGroup` rules in its local `.module.css`. Local modules SHALL retain only layout, grid, dropdown, and action classes.

#### Scenario: No cross-atom module import

- GIVEN `PrescriptionItemsList` is migrated
- WHEN `rg "inputStyles from '@/components/atoms/Input.module.css'"` runs
- THEN it returns zero matches

#### Scenario: No duplicated atom styles

- GIVEN the cleaned local `.module.css` files
- WHEN stylelint runs the BEM + duplication check
- THEN no class duplicates `Select`/`Input`/`Checkbox`/`FormGroup` rules

### Requirement: Preserve form behavior (no regressions)

The refactor SHALL preserve the vademecum autocomplete flow (search → dropdown → select → populate), `handleFreqPreset`, `handleQuantityChange`, `freqPresets`, field validations (`required`, `min`/`max`), and the `showMessage`/`useMessage`/`useLanguage` integrations. No i18n string or user-facing behavior SHALL change.

#### Scenario: Vademecum autocomplete intact

- GIVEN the user types ≥2 chars in med-name
- WHEN the vademecum search returns results
- THEN the dropdown appears and selecting an item populates name/presentation/monodroga/vademecum_id

#### Scenario: Submit guard preserved

- GIVEN medName is empty
- WHEN `handleSubmit` runs
- THEN no API request is sent and the modal stays open

### Requirement: Visual parity

Rendered forms SHALL be visually identical to the pre-refactor DOM (spacing, sizing, focus states), matching the `EditTransactionModal` reference pattern.

#### Scenario: Control styling parity

- GIVEN both versions rendered in the same viewport
- WHEN computed styles of the controls are compared
- THEN no layout or focus-state regression is observed

## Coverage

- Happy paths: covered (atom migration, options arrays, autocomplete)
- Edge cases: covered (empty medName submit, numeric option arrays)
- Error states: covered (message/validation integrations preserved)
