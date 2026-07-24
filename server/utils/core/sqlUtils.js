const TABLE_COLUMNS = {
    appointments: [
        'patient_id', 'doctor_id', 'start_time', 'end_time', 'status', 'type',
        'is_overbooked', 'description', 'google_event_id', 'payment_status', 'tariff',
        'institution_id', 'is_paid', 'is_notified', 'first_visit', 'debt_cleared_at',
        'cancellation_reason'
    ],
    doctors: [
        'user_id', 'full_name', 'specialty', 'google_calendar_id', 'appointment_duration',
        'visit_price', 'phone', 'email', 'mp_access_token', 'mp_public_key', 'mp_refresh_token',
        'mp_token_expiry', 'license_number', 'color', 'dni', 'cbu', 'alias', 'bank_name',
        'account_holder', 'prescription_price', 'allow_overbooking', 'percentage_cut',
        'has_pos'
    ],
    institutions: [
        'name', 'address', 'city', 'phone', 'email', 'status', 'description',
        'logo_url', 'contact_name', 'google_maps_url'
    ],
    insurances: [
        'name', 'phone', 'email', 'address', 'cuit', 'contact_person',
        'website', 'billing_period', 'status', 'notes'
    ],
    licenses: [
        'doctor_id', 'start_date', 'end_date', 'reason', 'status', 'notes'
    ],
    medical_requests: [
        'patient_id', 'doctor_id', 'type', 'status', 'details', 'payment_status',
        'price', 'mp_preference_id', 'mp_payment_id', 'admin_response'
    ],
    patients: [
        'user_id', 'first_name', 'last_name', 'full_name', 'dob', 'phone', 'email',
        'medical_history', 'dni', 'affiliate_number', 'insurance_id', 'tariff_percent',
        'tariff_override', 'behavior_rating', 'is_new_patient', 'marked_new_at',
        'visit_interval_days', 'prescription_interval_days', 'next_suggested_visit_date',
        'next_suggested_prescription_date', 'license_expiry_date', 'institution_id',
        'street_name', 'street_number', 'floor', 'apartment', 'city', 'province',
        'country', 'visit_notified', 'prescription_notified', 'license_notified'
    ],
    prescriptions: [
        'appointment_id', 'medications', 'instructions', 'payment_status', 'bonified'
    ],
    secretaries: [
        'user_id', 'full_name', 'phone', 'dni'
    ],
    transactions: [
        'type', 'amount', 'description', 'transaction_date', 'related_user_id',
        'doctor_id', 'method', 'status', 'proof_file', 'is_withdrawal', 'request_id',
        'appointment_id', 'institution_id'
    ]
};

function filterValidColumns(updates, tableName) {
    if (!updates || typeof updates !== 'object') return {};
    const validColumns = TABLE_COLUMNS[tableName];
    if (!validColumns) return updates; // Fallback if table is not defined

    const filtered = {};
    for (const [key, value] of Object.entries(updates)) {
        if (validColumns.includes(key)) {
            filtered[key] = value;
        }
    }
    return filtered;
}

function buildUpdateQuery(tableName, updates) {
    const filteredUpdates = filterValidColumns(updates, tableName);
    const keys = Object.keys(filteredUpdates);

    if (keys.length === 0) {
        return { setClauses: null, values: [] };
    }

    const setClauses = keys.map(key => `\`${key}\` = ?`).join(', ');
    const values = Object.values(filteredUpdates);

    return { setClauses, values };
}

function buildInsertQuery(tableName, data) {
    const filteredData = filterValidColumns(data, tableName);
    const keys = Object.keys(filteredData);

    if (keys.length === 0) {
        return { columns: null, placeholders: null, values: [] };
    }

    const columns = keys.map(key => `\`${key}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(filteredData);

    return { columns, placeholders, values };
}

module.exports = {
    filterValidColumns,
    buildUpdateQuery,
    buildInsertQuery,
    TABLE_COLUMNS
};
TABLE_COLUMNS.medical_request_items = [
    'request_id', 'medication_name', 'dose', 'frequency', 'quantity', 'status', 'vademecum_id'
];
