# Tasks: Slice 1 — Atoms in Forms + CSS Module Encapsulation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 140–200 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Migrate both forms to atoms + clean CSS modules | PR 1 | `pnpm --filter client lint` + `pnpm --filter client test -- i18n.parity` | Manual: open both forms, test autocomplete/frequency/checkbox/textarea | Revert 4 files: `PrescriptionItemsList.{jsx,module.css}` + `PatientMedicationFormModal.{jsx,module.css}` |

## Phase 1: PrescriptionItemsList — Select Atoms + CSS Cleanup

- [x] 1.1 Add imports to `client/src/features/medical_documents/components/lists/PrescriptionItemsList.jsx`: `Select` from `@/components/atoms/Select`, `FormGroup` from `@/components/molecules/FormGroup`
- [x] 1.2 Create `frequencyOptions` array from `freqPresets` prop: `value=idx`, `label=t('freq_'+safeKey)` with fallback `p.text` capitalized
- [x] 1.3 Create `unitsPerBoxOptions = [{value:'',label:'-'}, ...[10,14,20,28,30,40,50,60,100].map(v=>({value:v,label:String(v)}))]` and `boxesOptions = [{value:'',label:'-'}, ...[1..10].map(v=>({value:v,label:String(v)}))]`
- [x] 1.4 Replace 3 raw `<select>` with `<FormGroup><Select options={...} value={...} onChange={...} size="sm" className={styles.PrescriptionItemsList__controlSm} ariaLabel={t('...')} /></FormGroup>` preserving `handleFreqPreset` and `handleQuantityChange` handlers
- [x] 1.5 Remove `import inputStyles from '@/components/atoms/Input.module.css'` and all `inputStyles.Input__root/Input__sm` usages
- [x] 1.6 Clean `client/src/features/medical_documents/components/lists/PrescriptionItemsList.module.css`: remove `.PrescriptionItemsList__formSelectUnits`, `__formSelectBoxes`, `__optionBlack`; audit `__controlSm` (keep only if still referenced by Select)

## Phase 2: PatientMedicationFormModal — Input/Checkbox/AutoTextarea + FormGroup + CSS Cleanup

- [x] 2.1 Add imports to `client/src/features/patients/components/modals/PatientMedicationFormModal.jsx`: `Input`, `AutoTextarea`, `Checkbox` from `@/components/atoms/*`, `FormGroup` from `@/components/molecules/FormGroup`
- [x] 2.2 Replace `med-name` field: `<FormGroup label={t('medication_name')} required htmlFor="med-name"><Input id="med-name" value={medName} onChange={e=>handleSearchVademecum(e.target.value)} placeholder={t('search_medication_placeholder')} required autoComplete="off" /></FormGroup>` keep `dropdownRef` + custom `<ul>` dropdown
- [x] 2.3 Replace `med-dose` and `med-frequency` (free-text per spec): `<FormGroup label={t('dosage')} htmlFor="med-dose"><Input id="med-dose" value={dose} onChange={e=>setDose(e.target.value)} placeholder={t('dose_example_placeholder')} /></FormGroup>` and same for `med-frequency` with `t('frequency')` / `t('freq_example_placeholder')`
- [x] 2.4 Replace `med-boxes`: `<FormGroup label={t('boxes_count')} htmlFor="med-boxes"><Input id="med-boxes" type="number" min="1" max="10" value={boxesCount} onChange={e=>setBoxesCount(e.target.value)} /></FormGroup>`
- [x] 2.5 Replace `isChronic`: `<FormGroup><Checkbox label={t('is_chronic')} checked={isChronic} onChange={e=>setIsChronic(e.target.checked)} /></FormGroup>` remove raw `<input type="checkbox">` + `__checkLabel` wrapper
- [x] 2.6 Replace `med-notes`: `<FormGroup label={t('notes')} htmlFor="med-notes"><AutoTextarea id="med-notes" value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t('notes_example_placeholder')} rows={2} /></FormGroup>`
- [x] 2.7 Clean `client/src/features/patients/components/modals/PatientMedicationFormModal.module.css`: remove `__input`, `__textarea`, `__checkLabel`, `__checkInput`, `__label` duplicates; keep `__root`, `__fieldGroup`, `__gridTwoCols`, `__inputWrapper`, `__dropdown*`, `__item*`, `__actions`, `__searchingSpinner`, `__fieldGroupCheck` (layout only)

## Phase 3: Verification

- [x] 3.1 Run `pnpm --filter client oxlint` (or `pnpm --filter client lint`) on 4 touched files — zero errors
- [x] 3.2 Run `pnpm --filter client test -- i18n.parity` — passes, no new hardcoded strings
- [x] 3.3 Verify no cross-atom import: `rg "Input\.module\.css" client/src/features/medical_documents/components/lists/PrescriptionItemsList.jsx` and same for `PatientMedicationFormModal.jsx` returns zero
- [x] 3.4 Manual visual test: vademecum search ≥2 chars → dropdown → select populates name/presentation/monodroga/vademecum_id; frequency free-text accepts any value; Checkbox toggles; AutoTextarea auto-resizes; empty medName blocks submit
- [x] 3.5 Visual parity check vs `EditTransactionModal` reference: spacing, `size="sm"` sizing, focus states identical

## Done Criteria

- [x] All tasks checked
- [x] `Select`/`Input`/`AutoTextarea`/`Checkbox` + `FormGroup` used; no raw `<select>`/`<input>`/`<textarea>`/`<input type="checkbox">` remains except hidden native input inside `Checkbox` atom
- [x] Options arrays typed as `{label,value}`; no inline `<option>` children in consuming components
- [x] No `Input.module.css` import in consuming components; local modules contain only layout/grid/dropdown/action classes
- [x] Tests + oxlint green; i18n parity green; manual autocomplete flow verified

## Files to Touch

- `client/src/features/medical_documents/components/lists/PrescriptionItemsList.jsx`
- `client/src/features/medical_documents/components/lists/PrescriptionItemsList.module.css`
- `client/src/features/patients/components/modals/PatientMedicationFormModal.jsx`
- `client/src/features/patients/components/modals/PatientMedicationFormModal.module.css`

## Dependencies & Order

- Phase 1 before Phase 2 (PrescriptionItemsList is smaller, validates `Select` + `FormGroup` pattern)
- Phase 2 before Phase 3 (verification requires both migrations complete)
