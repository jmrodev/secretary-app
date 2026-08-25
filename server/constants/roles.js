const ROLES = {
    ADMIN: 'admin',
    SECRETARY: 'secretary',
    DOCTOR: 'doctor'
};

const ACCESS_LEVELS = {
    // System Administration (Delete institutions, view full audit logs)
    SYSTEM_ADMIN: [ROLES.ADMIN],

    // Core Management (Finance, Institutions, Insurances, Consultorios)
    MANAGE_CORE_DATA: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],

    // Patient Management (Patients details, stats, reminders)
    MANAGE_PATIENTS: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],

    // Staff/User Management (Create users, reset passwords)
    MANAGE_USERS: [ROLES.ADMIN, ROLES.SECRETARY],

    // Integrations (Google sync, etc)
    MANAGE_INTEGRATIONS: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR],

    // Finance (Transactions, Stats)
    MANAGE_FINANCE: [ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR]
};

module.exports = { ROLES, ACCESS_LEVELS };
