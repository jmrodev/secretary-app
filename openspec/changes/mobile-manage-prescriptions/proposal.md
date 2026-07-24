# Proposal: Password Protected Prescription Deletion

## Motivation
To prevent accidental or unauthorized deletion of medical prescriptions, the deletion operation must require password confirmation from the logged-in doctor/secretary.

## Proposed Changes
1. **Backend Password Validation**: Update `PrescriptionService.deletePrescription` to verify the user's password using `bcrypt.compare` against `users.password_hash`. Return `invalid_password` HTTP 401 if incorrect.
2. **Mobile Password Prompt Modal**: In `PatientDetailScreen.jsx`, when tapping `🗑️ Eliminar Receta`, present a secure password input modal before performing the delete API call.
