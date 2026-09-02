# Proposal: Slice 1 — Atoms in Forms + CSS Module Encapsulation

## Intent

GGA (Guardian Angel) flags violations of Atomic Design and CSS Module encapsulation in two medical forms:
- `PrescriptionItemsList.jsx`: 3 raw `<select>` elements importing `Input.module.css` classes (`Input__root`, `Input__sm`) — violates atom encapsulation; should use `Select` atom.
- `PatientMedicationFormModal.jsx`: 4 raw `<input>` (text/number), 1 raw `<textarea>`, 1 raw `<checkbox>` with local CSS module — violates atom encapsulation; should use `Input`, `AutoTextarea`, `Checkbox` atoms with `FormGroup` molecule.

The reference pattern (`EditTransactionModal`) correctly uses `FormGroup` + atoms (`Select`, `Input`, `CurrencyInput`, `AutoTextarea`, `Button`).

## Scope

### In Scope
- **PrescriptionItemsList.jsx + .module.css**: Replace 3 raw `<select>` with `Select` atom; remove `Input.module.css` import; convert `freqPresets` + hardcoded arrays to `options` arrays for `Select`.
- **PatientMedicationFormModal.jsx + .module.css**: Replace raw inputs with `Input` (text, number), `AutoTextarea`, `Checkbox`; wrap fields in `FormGroup`; keep vademecum autocomplete dropdown custom (uses `Input` atom for the text field); remove local input/textarea/checkbox styles from module.

### Out of Scope
- `MedicationAutocomplete` component (atom/molecule boundary separate slice).
- Other forms in the codebase (future slices).
- Backend/API changes.

## Capabilities

### New Capabilities
None — pure refactor using existing atoms.

### Modified Capabilities
- `frontend-style-unification`: This change advances the atomic-design/compliance requirements tracked in this capability.

## Approach

Follow `EditTransactionModal` pattern:
1. Import atoms: `Select`, `Input`, `AutoTextarea`, `Checkbox`, `FormGroup` from `@/components/atoms` / `@/components/molecules`.
2. In `PrescriptionItemsList`:
   - Build `options` arrays: `frequencyOptions` from `freqPresets`, `unitsPerBoxOptions` = `[10,14,20,28,30,40,50,60,100]`, `boxesOptions` = `[1..10]`.
   - Replace each `<select>` with `<Select value={...} onChange={...} options={...} size="sm" className={styles.PrescriptionItemsList__controlSm} />`.
   - Remove `inputStyles` import and usage.
3. In `PatientMedicationFormModal`:
   - Wrap each field in `<FormGroup label={t('...')}>...</FormGroup>`.
   - Med name: keep custom autocomplete logic but use `Input` atom for the text field.
   - Dose: `Input` (text). Frequency: `Input` (text) — or `Select` if frequency presets exist (tbd).
   - Boxes: `Input` type="number" min=1 max=10. Notes: `AutoTextarea`. Chronic: `Checkbox` with `label={t('is_chronic')}`.
   - Remove local CSS for inputs/textarea/checkbox; keep dropdown/spinner/action styles.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `client/src/features/medical_documents/components/lists/PrescriptionItemsList.jsx` | Modified | Replace 3 selects with Select atom; remove Input.module.css import |
| `client/src/features/medical_documents/components/lists/PrescriptionItemsList.module.css` | Modified | Remove unused select/input control classes; keep layout classes |
| `client/src/features/patients/components/modals/PatientMedicationFormModal.jsx` | Modified | Replace raw inputs with atoms; add FormGroup wrappers |
| `client/src/features/patients/components/modals/PatientMedicationFormModal.module.css` | Modified | Remove input/textarea/checkbox styles; keep dropdown/grid/actions |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vademecum autocomplete dropdown breaks | Medium | Keep custom dropdown; only swap the text `<input>` for `Input` atom; test search/selection flow manually |
| Frequency field in PatientMedicationFormModal: free text vs preset | Medium | Match current behavior (free text). If presets needed later, separate slice with `Select` + options |
| Select atom `size="sm"` styling mismatch | Low | `Select` supports `size` prop; verify visual parity with existing `Input__sm` |
| i18n keys for option labels | Low | `PrescriptionItemsList` already uses translation keys for freq presets; reuse same keys |

## Rollback Plan

Revert the 4 changed files via git. No database/migrations involved.

## Dependencies

- Existing atoms (`Select`, `Input`, `AutoTextarea`, `Checkbox`, `FormGroup`) must be stable — they are.
- `freqPresets` prop passed to `PrescriptionItemsList` must contain label/value for options mapping.

## Success Criteria

- [ ] GGA passes: no Atomic Design / CSS module encapsulation violations in these 2 files.
- [ ] Existing tests pass (unit + integration for medical documents & patients features).
- [ ] i18n parity: all user-visible text still translates; no new hardcoded strings.
- [ ] Visual parity: forms look identical to before (same spacing, sizing, focus states).
- [ ] Vademecum autocomplete works: search → dropdown → select → populates fields.