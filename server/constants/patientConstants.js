/**
 * patientConstants.js
 * Centralized constants for patient-related logic to ensure consistency
 * and avoid using deprecated fields like 'address'.
 */

const PATIENT_FIELDS = new Set([
    'first_name', 'last_name', 'full_name', 'dob', 'phone', 'email',
    'street_name', 'street_number', 'floor', 'apartment',
    'city', 'province', 'country', 'medical_history', 'dni',
    'affiliate_number', 'insurance_id', 'institution_id',
    'tariff_percent', 'tariff_override', 'behavior_rating',
    'visit_interval_days', 'prescription_interval_days',
    'next_suggested_visit_date', 'next_suggested_prescription_date',
    'license_expiry_date', 'is_new_patient', 'marked_new_at'
]);

module.exports = {
    PATIENT_FIELDS
};
