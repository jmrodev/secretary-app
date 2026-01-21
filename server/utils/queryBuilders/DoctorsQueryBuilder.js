const BaseQueryBuilder = require('./BaseQueryBuilder');
const { pool } = require('../../db');

/**
 * DoctorsQueryBuilder - Constructor de queries para la entidad Doctors
 * Maneja filtros por especialidad, estadísticas de turnos, etc.
 */
class DoctorsQueryBuilder extends BaseQueryBuilder {
    constructor(user) {
        super('doctors d', user);

        // Campos base de doctores
        this.select([
            'd.id',
            'd.user_id',
            'd.full_name',
            'd.dni',
            'd.phone',
            'd.specialty',
            'd.office_number',
            'd.rental_type',
            'd.rental_cost',
            'd.consultation_price',
            'd.prescription_price',
            'd.medical_license_price',
            'd.certificate_price',
            'd.virtual_consultation_price',
            'd.appointment_duration',
            'd.break_duration',
            'd.cbu',
            'd.default_visit_interval_days',
            'd.default_prescription_interval_days',
            'd.created_at'
        ]);
    }

    /**
     * Incluye información del usuario asociado
     */
    includeUserInfo() {
        this.leftJoin('users u', 'd.user_id = u.id');
        this.select(['u.username', 'u.role']);
        return this;
    }

    /**
     * Incluye estadísticas de turnos del doctor
     */
    includeAppointmentStats() {
        this.select([
            `(SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id) as total_appointments`,
            `(SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.status = 'completed') as completed_appointments`,
            `(SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.status = 'pending') as pending_appointments`
        ]);
        return this;
    }

    /**
     * Incluye el número de pacientes asignados
     */
    includePatientCount() {
        this.select(
            `(SELECT COUNT(DISTINCT patient_id) FROM patient_doctors pd WHERE pd.doctor_id = d.id) as total_patients`
        );
        return this;
    }

    /**
     * Incluye ingresos totales
     */
    includeRevenue() {
        this.select(
            `(SELECT COALESCE(SUM(t.amount), 0) FROM transactions t 
              INNER JOIN appointments a ON t.appointment_id = a.id 
              WHERE a.doctor_id = d.id AND t.status = 'completed') as total_revenue`
        );
        return this;
    }

    /**
     * Filtra por especialidad
     */
    filterBySpecialty(specialty) {
        if (specialty) {
            this.where('d.specialty = ?', specialty);
        }
        return this;
    }

    /**
     * Filtra por consultorio
     */
    filterByOffice(officeNumber) {
        if (officeNumber) {
            this.where('d.office_number = ?', officeNumber);
        }
        return this;
    }

    /**
     * Aplica búsqueda por texto
     * Busca en: nombre completo, DNI, especialidad
     */
    applySearch(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') return this;

        const term = `%${searchTerm}%`;
        this.orWhere([
            { condition: 'd.full_name LIKE ?', params: term },
            { condition: 'd.dni LIKE ?', params: term },
            { condition: 'd.specialty LIKE ?', params: term }
        ]);

        return this;
    }

    /**
     * Aplica filtro por rol del usuario
     * - Doctor: solo su propio perfil
     * - Admin/Secretary: todos los doctores
     */
    async applyRoleFilter() {
        if (!this.user) return this;

        if (this.user.role === 'doctor') {
            // Solo su propio perfil
            const conn = await pool.getConnection();
            try {
                const docRows = await conn.query(
                    "SELECT id FROM doctors WHERE user_id = ?",
                    [this.user.user_id]
                );

                if (docRows && docRows.length > 0) {
                    const doctorId = docRows[0].id;
                    this.where('d.id = ?', doctorId);
                }
            } finally {
                conn.release();
            }
        }
        // Admin y secretary ven todos

        return this;
    }

    /**
     * Ordena por nombre
     */
    sortByName(direction = 'ASC') {
        this.orderBy('d.full_name', direction);
        return this;
    }

    /**
     * Ordena por especialidad
     */
    sortBySpecialty(direction = 'ASC') {
        this.orderBy('d.specialty', direction);
        return this;
    }

    /**
     * Método de conveniencia para obtener configuración completa
     */
    withFullDetails() {
        return this
            .includeUserInfo()
            .includeAppointmentStats()
            .includePatientCount();
    }
}

module.exports = DoctorsQueryBuilder;
