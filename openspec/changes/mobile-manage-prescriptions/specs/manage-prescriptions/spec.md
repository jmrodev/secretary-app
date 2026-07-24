# Specification: Password Protected Prescription Deletion

## Requirements

### Requirement 5: Password Protected Prescription Deletion
Deleting any prescription MUST require password verification from the logged-in user.

#### Scenario 5.1: Successful deletion with correct password
- GIVEN a doctor viewing a prescription in the mobile app
- WHEN the doctor taps "🗑️ Eliminar Receta", enters their correct password, and confirms
- THEN the backend verifies the password via `bcrypt.compare` and deletes the prescription
- AND the UI displays "Receta eliminada" and refreshes the list

#### Scenario 5.2: Rejection with incorrect password
- GIVEN a user attempting to delete a prescription
- WHEN an incorrect password is provided
- THEN the backend rejects with `invalid_password` (401)
- AND the mobile app displays "Contraseña incorrecta"
