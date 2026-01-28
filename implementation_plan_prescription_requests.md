# Implementation Plan - Patient Prescription Request System

This plan outlines the steps to implement a system where patients can request prescriptions through a secure, shareable link.

## 1. Database Schema Changes

### 1.1 New Table: `prescription_request_tokens`
- `id`: INT PRIMARY KEY AUTO_INCREMENT
- `patient_id`: INT NOT NULL (FK to patients)
- `doctor_id`: INT NULL (FK to doctors, optional)
- `token`: VARCHAR(255) UNIQUE NOT NULL
- `expires_at`: DATETIME NOT NULL
- `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

### 1.2 Update Table: `medical_requests` (Optional but recommended)
- `is_patient_submitted`: BOOLEAN DEFAULT FALSE
- `raw_medication_data`: TEXT (JSON string storing the medications requested)

## 2. Backend Development

### 2.1 Medical Controller Updates (`server/controllers/medicalController.js`)
- **`generatePrescriptionRequestToken`**: Generates a 32-char hex token, sets 48h expiry, saves to DB.
- **`getPublicPrescriptionRequestData`**: (Public) Verifies token, returns patient name and their medication history (names from `prescriptions` or `patient_medications`).
- **`submitPublicPrescriptionRequest`**: (Public) Receives requested meds, creates a `medical_requests` entry with `status = 'pending'` and info about the origin.

### 2.2 Routing
- Add protected route for generation in `medicalRoutes.js`.
- Add public routes in a new/existing public router if applicable, or just separate them in `medicalRoutes.js` (by skipping `verifyToken` middleware for these specific paths).

## 3. Frontend Development

### 3.1 Public Page (`client/src/pages/PublicPrescriptionRequest.jsx`)
- Use a dedicated layout (no sidebar/header for patients).
- **Form Features**:
    - Display patient name.
    - List "Recent Medications" (selectable chips/list).
    - Search input for "Other Medications" using the existing Vademecum API.
    - Submit button with success feedback.

### 3.2 Staff UI Updates
- **`PatientManagerModal.jsx`**: Add a "Copiar Link de Receta" button that calls the generation API and copies the URL to clipboard.
- **`Requests.jsx`**: Ensure patient-submitted requests are highlighted and display the requested medications clearly.

## 4. WhatsApp Integration
- The link generated will be copied to clipboard so the staff can paste it into WhatsApp (manual "pegado a mano").
- Future-proofing for Meta API integration by ensuring the token structure is clean.

## 6. Debugging & Fixes (Current Phase)

### 6.1 Backend Fixes (`server/controllers/medicalController.js`)
- [ ] Remove incorrect array destructuring from `submitPublicPrescriptionRequest` and `getPublicPrescriptionRequestData`.
- [ ] Improve medication name extraction logic to handle comma-separated strings or potential JSON in the `medications` field of the `prescriptions` table.
- [ ] Ensure `doctorId` fallback is robust.

### 6.2 Frontend Fixes (`client/src/pages/PublicPrescriptionRequest.jsx`)
- [ ] Improve CSS for medication chips to ensure they wrap correctly and are all visible.
- [ ] Add better error reporting on the submission failure.
