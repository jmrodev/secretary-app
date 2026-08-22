</Delta for doctor-fiscal-wizard>
<doctor-fiscal-wizard Specification>
## Purpose

Defines the step-by-step UI flow (Wizard) for configuring a doctor's AFIP credentials, generating the CSR, and uploading certificates within the `DoctorEditModal`.

## Requirements

### Requirement: Step-by-Step Navigation

The system MUST provide a linear 4-step wizard to guide users through entering fiscal data, generating a CSR, uploading a certificate, and testing the connection.

#### Scenario: User navigates through all steps

- GIVEN an authenticated user editing a doctor's fiscal details
- WHEN they open the fiscal wizard
- THEN they MUST see 4 distinct steps (Fiscal Data, CSR Generation, Upload Certificate, Test Connection)
- AND they MUST be able to navigate linearly from step 1 to 4 using "Next" and "Back" buttons.

#### Scenario: Existing credentials detection

- GIVEN a doctor with existing valid fiscal credentials (CUIT, PTO VTA, Certificate)
- WHEN the user opens the wizard
- THEN the system SHOULD populate existing data in the respective steps
- AND allow skipping to the final connection test.

### Requirement: Step 1 - Fiscal Data Entry

The system MUST capture basic fiscal data before proceeding.

#### Scenario: User enters CUIT and Punto de Venta

- GIVEN the user is on Step 1 of the fiscal wizard
- WHEN they input a valid CUIT and Punto de Venta and click "Next"
- THEN the system MUST save this state locally in the wizard and proceed to Step 2.

#### Scenario: User skips required fields

- GIVEN the user is on Step 1
- WHEN they leave CUIT or Punto de Venta blank and click "Next"
- THEN the system MUST show a validation error and prevent proceeding.

### Requirement: Step 2 - CSR Generation

The system MUST generate a Certificate Signing Request (CSR) and provide instructions for the AFIP portal.

#### Scenario: User generates and copies CSR

- GIVEN the user is on Step 2
- WHEN the step loads
- THEN the system MUST present a generated CSR string and a "Copy to Clipboard" button
- AND MUST display explicit instructions on how to use this CSR on the AFIP portal.

### Requirement: Step 3 - Certificate Upload

The system MUST allow uploading the resulting `.crt` file obtained from AFIP.

#### Scenario: User uploads valid certificate

- GIVEN the user is on Step 3
- WHEN they select and upload a valid `.crt` file
- THEN the system MUST store the certificate state
- AND allow proceeding to Step 4.

### Requirement: Step 4 - Connection Test

The system MUST provide a final check to verify credentials.

#### Scenario: User tests connection successfully

- GIVEN the user is on Step 4 with all previous data collected
- WHEN they click "Test Connection"
- THEN the system MUST verify the credentials against the AFIP API
- AND display a success message if the connection is active.
</doctor-fiscal-wizard Specification>
