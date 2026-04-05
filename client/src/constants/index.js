/**
 * System Roles Constants
 * Use these instead of hardcoded strings throughout the application.
 */
export const ROLES = {
    ADMIN: 'admin',
    SECRETARY: 'secretary',
    DOCTOR: 'doctor',
    PATIENT: 'patient'
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'token',
    USER_INFO: 'user',
    LAST_SELECTED_DOCTOR_ID: 'last_selected_doctor_id',
    THEME_PREFERENCE: 'theme'
};

/**
 * API Status Codes (Optional, but good for standardization)
 */
export const STATUS_CODES = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500
};

/**
 * Appointment Types
 */
export const APPOINTMENT_TYPES = {
    CONSULTATION: 'consultation',
    PRACTICE: 'practice',
    VIRTUAL: 'virtual'
};
