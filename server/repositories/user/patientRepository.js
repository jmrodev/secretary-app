

/**
 * PatientRepository
 * Core data access for patients.
 */
class PatientRepository {
    constructor(pool) {
        this.pool = pool;
    }

static ALLOWED_FIELDS = [
    'user_id', 'first_name', 'last_name', 'full_name', 'dob', 'phone', 'email',
    'medical_history', 'dni', 'affiliate_number', 'insurance_id', 'tariff_percent',
    'tariff_override', 'behavior_rating', 'is_new_patient', 'marked_new_at',
    'visit_interval_days', 'prescription_interval_days', 'next_suggested_visit_date',
    'next_suggested_prescription_date', 'license_expiry_date', 'institution_id',
    'street_name', 'street_number', 'floor', 'apartment', 'city', 'province',
    'country', 'visit_notified', 'prescription_notified', 'license_notified'
];

    async findById(id, conn = this.pool) {
        if (!id) return null;
        const connection = conn || await this.pool.getConnection();
        try {
            const PatientsQueryBuilder = require('../../utils/database/queryBuilders/PatientsQueryBuilder');
            const builder = new PatientsQueryBuilder();
            builder.withFullDetails().where('p.id = ?', id);
            const { query, params } = builder.build();
            const rows = await connection.query(query, params);
            return rows.length > 0 ? rows[0] : null;
        } finally {
            if (!conn) connection.release();
        }
    }

    async findByPhone(phone, conn = this.pool) {
        if (!phone) return null;
        const connection = conn || await this.pool.getConnection();
        try {
            const cleanDigits = phone.toString().replace(/\D/g, '');
            if (!cleanDigits) return null;
            const rows = await connection.query(`
                SELECT DISTINCT p.* 
                FROM patients p
                LEFT JOIN phone_numbers pn ON pn.entity_type = 'patient' AND pn.entity_id = p.id
                WHERE REPLACE(REPLACE(p.phone, '+', ''), ' ', '') LIKE ? 
                   OR REPLACE(REPLACE(pn.phone_number, '+', ''), ' ', '') LIKE ?
                LIMIT 1
            `, [`%${cleanDigits.slice(-8)}%`, `%${cleanDigits.slice(-8)}%`]);
            return rows.length > 0 ? rows[0] : null;
        } finally {
            if (!conn) connection.release();
        }
    }


    async findTariffAndInstitutionPrice(patientId, appointmentInstitutionId, conn = this.pool) {
        let query;
        let params;

        if (appointmentInstitutionId === null) {
            // Explicitly NO institution
            query = `SELECT tariff_percent, tariff_override, NULL as inst_price FROM patients WHERE id = ?`;
            params = [patientId];
        } else if (appointmentInstitutionId) {
            // Specific institution provided
            query = `
                SELECT p.tariff_percent, p.tariff_override, i.base_price as inst_price 
                FROM patients p
                LEFT JOIN institutions i ON i.id = ?
                WHERE p.id = ?
            `;
            params = [appointmentInstitutionId, patientId];
        } else {
            // Default: use patient's assigned institution
            query = `
                SELECT p.tariff_percent, p.tariff_override, i.base_price as inst_price 
                FROM patients p
                LEFT JOIN institutions i ON p.institution_id = i.id
                WHERE p.id = ?
            `;
            params = [patientId];
        }

        const rows = await conn.query(query, params);
        return rows[0] || null;
    }

    async findByUserId(userId, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM patients WHERE user_id = ?", [userId]);
        return rows[0] || null;
    }

    async findUserIdById(id, conn = this.pool) {
        const rows = await conn.query("SELECT user_id FROM patients WHERE id = ?", [id]);
        return rows[0]?.user_id || null;
    }

    async findByFullName(fullName, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM patients WHERE full_name = ?", [fullName]);
        return rows[0] || null;
    }

    async findByDni(dni, conn = this.pool) {
        const rows = await conn.query("SELECT * FROM patients WHERE dni = ?", [dni]);
        return rows[0] || null;
    }

    async findByFuzzyName(name, conn = this.pool) {
        const rows = await conn.query(
            "SELECT id FROM patients WHERE LOWER(TRIM(REGEXP_REPLACE(full_name, '[[:space:]]+', ' '))) = LOWER(TRIM(REGEXP_REPLACE(?, '[[:space:]]+', ' ')))",
            [name]
        );
        return rows[0] || null;
    }

    async findByNameLike(name, conn = this.pool) {
        const rows = await conn.query(
            "SELECT id FROM patients WHERE full_name LIKE ?",
            [`%${name}%`]
        );
        return rows[0] || null;
    }

    async create(data, conn = this.pool) {
        const filteredData = Object.keys(data)
            .filter(key => PatientRepository.ALLOWED_FIELDS.includes(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {});

        if (Object.keys(filteredData).length === 0) {
            throw new Error('No valid fields provided for creation');
        }

        const fields = Object.keys(filteredData).join(', ');
        const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
        const values = Object.values(filteredData);
        const result = await conn.query(`INSERT INTO patients (${fields}) VALUES (${placeholders})`, values);
        return Number(result.insertId);
    }

    async update(id, updates, conn = this.pool) {
        const filteredUpdates = Object.keys(updates)
            .filter(key => PatientRepository.ALLOWED_FIELDS.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {});

        if (Object.keys(filteredUpdates).length === 0) {
            return { affectedRows: 0 }; // Nothing to update
        }

        const fields = Object.keys(filteredUpdates).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(filteredUpdates).map(v => v === '' ? null : v), id];
        return await conn.query(`UPDATE patients SET ${fields} WHERE id = ?`, values);
    }

    async updateLicenseInfo(id, expiryDate, conn = this.pool) {
        return await conn.query("UPDATE patients SET license_expiry_date = ?, license_notified = 0 WHERE id = ?", [expiryDate, id]);
    }

    async updatePrescriptionInfo(id, nextDate, conn = this.pool) {
        return await conn.query("UPDATE patients SET next_suggested_prescription_date = ?, prescription_notified = 0 WHERE id = ?", [nextDate, id]);
    }

    async getPrescriptionInterval(patientId, doctorId, conn = this.pool) {
        const rows = await conn.query("SELECT prescription_interval_days FROM patients WHERE id = ?", [patientId]);
        return rows[0] || null;
    }

    async findRecentMedications(patientId, conn = this.pool) {
        return await conn.query(`
            SELECT medications as name FROM prescriptions pr 
            JOIN appointments a ON pr.appointment_id = a.id 
            WHERE a.patient_id = ?
            UNION
            SELECT medication_name as name FROM patient_medications 
            WHERE patient_id = ?
        `, [patientId, patientId]);
    }

    async getAssignedDoctors(patientId, conn = this.pool) {
        return await conn.query(`
            SELECT d.id, d.full_name 
            FROM patient_doctors pd 
            JOIN doctors d ON pd.doctor_id = d.id 
            WHERE pd.patient_id = ?`, [patientId]);
    }

    async updateAssignedDoctors(patientId, doctorIds, conn = this.pool) {
        await conn.query("DELETE FROM patient_doctors WHERE patient_id = ?", [patientId]);
        if (doctorIds && doctorIds.length > 0) {
            const insertValues = doctorIds.map(docId => [patientId, docId]);
            await conn.batch("INSERT INTO patient_doctors (patient_id, doctor_id) VALUES (?, ?)", insertValues);
        }
    }
    async searchPatients(filters, user, conn) {
        const { search = '', page = 1, limit = 50, doctor_id = null } = filters;
        const normalizedDoctorId = doctor_id || null;
        const trimmed = (search || '').trim();

        const activePool = (conn && conn.getConnection) ? conn : (this.pool || require('../../db').pool);
        const connection = (activePool.getConnection) ? await activePool.getConnection() : activePool;

        try {
            const results = await connection.query(
                "CALL sp_search_patients(?, ?, ?, ?, ?, ?, @p_total_count)",
                [trimmed, page, limit, normalizedDoctorId, user.role, user.user_id]
            );
            const resultsCount = await connection.query("SELECT @p_total_count as total");
            return {
                patients: results[0] || [],
                totalCount: Number(resultsCount[0]?.total || 0)
            };
        } finally {
            if (activePool.getConnection && connection) {
                connection.release();
            }
        }
    }
}

const defaultPool = process.env.NODE_ENV === 'test' ? null : require('../../db').pool;
const instance = new PatientRepository(defaultPool);
const factory = (customPool) => new PatientRepository(customPool);
Object.setPrototypeOf(factory, instance);
module.exports = factory;
