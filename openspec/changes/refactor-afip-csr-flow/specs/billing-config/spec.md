</Delta for billing-config>
## MODIFIED Requirements

### Requirement: Requirement 2: Doctor Fiscal Status Matrix

- `BillingSettings` MUST display a doctor fiscal overview table listing all active doctors in the clinic.
- For each doctor, the table MUST display:
  - Doctor full name and specialty
  - CUIT (configured or missing badge)
  - Point of Sale (`afip_pto_vta` configured or missing badge)
  - Digital Certificate / Key status (`afipCrt` & `afipKey` present or missing badge)
  - Overall AFIP readiness status (`Ready` when CUIT, POS, and certificate/key exist; `Incomplete` otherwise)
- Each row MUST provide an action button to open the doctor's fiscal configuration in `DoctorEditModal`.

(Previously: `DoctorEditModal` opened focused on flat fiscal fields; now focuses on the fiscal wizard)

#### Scenario: Doctor with complete fiscal credentials displayed as ready
- GIVEN a doctor with valid `cuit`, `afip_pto_vta`, and uploaded `afipCrt`/`afipKey`
- WHEN `BillingSettings` renders the doctor matrix
- THEN the doctor row MUST display green success badges for CUIT, POS, Certificate, and an overall `Ready` status.

#### Scenario: Doctor with missing certificate displayed as incomplete
- GIVEN a doctor with `cuit` and `afip_pto_vta` configured but no uploaded `afipCrt`
- WHEN `BillingSettings` renders the doctor matrix
- THEN the doctor row MUST display a warning badge for Certificate and an overall `Incomplete` status.

#### Scenario: User clicks doctor edit action from billing matrix
- GIVEN an authenticated user viewing the doctor fiscal matrix in `BillingSettings`
- WHEN the user clicks the edit action on a doctor's row
- THEN `DoctorEditModal` MUST open pre-populated with that doctor's data and automatically focus on the new fiscal wizard interface.
