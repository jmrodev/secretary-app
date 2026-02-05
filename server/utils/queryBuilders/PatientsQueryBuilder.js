const BaseQueryBuilder = require('./BaseQueryBuilder');
const { pool } = require('../../db');

/**
 * PatientsQueryBuilder - Constructor de queries para la entidad Patients
 * Maneja filtros por rol, búsquedas, e inclusión de datos relacionados
 */
class PatientsQueryBuilder extends BaseQueryBuilder {
    constructor(user) {
        super('patients p', user);

        // Campos base de pacientes
        this.select([
            'p.id',
            'p.user_id',
            'p.full_name',
            'p.first_name',
            'p.last_name',
            'p.dni',
            'p.phone',
            'p.email',
            'p.address',
            'p.street_name',
            'p.street_number',
            'p.floor',
            'p.apartment',
            'p.city',
            'p.province',
            'p.country',
            'p.dob',
            'p.medical_history',
            'p.insurance_id',
            'p.affiliate_number',
            'p.tariff_percent',
            'p.tariff_override',
            'p.behavior_rating',
            'p.visit_interval_days',
            'p.prescription_interval_days',
            'p.institution_id',
            'p.next_suggested_visit_date',
            'p.next_suggested_prescription_date',
            'p.license_expiry_date',
            'p.is_new_patient',
            'p.marked_new_at'
        ]);
    }

    /**
     * Incluye el nombre de la obra social
     */
    includeInsurance() {
        this.leftJoin('insurances i', 'p.insurance_id = i.id');
        this.select('i.name as insurance_name');
        return this;
    }

    /**
     * Incluye el nombre de la institución
     */
    includeInstitution() {
        this.leftJoin('institutions inst', 'p.institution_id = inst.id');
        this.select('inst.name as institution_name');
        return this;
    }

    /**
     * Incluye la deuda total del paciente
     */
    includeDebtStats() {
        this.select(`(
            SELECT COALESCE(SUM(t.amount), 0) 
            FROM transactions t 
            LEFT JOIN appointments a ON t.appointment_id = a.id 
            WHERE t.related_user_id = p.user_id 
            AND t.status = 'pending' 
            AND (t.appointment_id IS NULL OR a.status IN ('completed', 'attended', 'arrived', 'absent'))
        ) as total_debt`);
        return this;
    }

    /**
     * Incluye estadísticas de turnos
     */
    includeAppointmentStats() {
        this.select([
            `(SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id) as total_appointments`,
            `(SELECT COUNT(*) FROM appointments a WHERE a.patient_id = p.id AND (a.status = 'absent' OR (a.status = 'cancelled' AND COALESCE(a.cancellation_reason, '') NOT LIKE '%error%'))) as missed_appointments`
        ]);
        return this;
    }

    /**
     * Aplica filtro por rol del usuario
     * - Doctor: solo sus pacientes asignados
     * - Admin/Secretary: todos los pacientes
     * - Patient: bloqueado (se maneja en el controller)
     */
    async applyRoleFilter() {
        if (!this.user) return this;

        if (this.user.role === 'doctor') {
            // Necesitamos el doctor_id
            const conn = await pool.getConnection();
            try {
                const docRows = await conn.query(
                    "SELECT id FROM doctors WHERE user_id = ?",
                    [this.user.user_id]
                );

                if (docRows && docRows.length > 0) {
                    const doctorId = docRows[0].id;
                    this.innerJoin('patient_doctors pd', 'p.id = pd.patient_id');
                    this.where('pd.doctor_id = ?', doctorId);
                }
            } finally {
                conn.release();
            }
        }

        return this;
    }

    /**
     * Aplica búsqueda por texto
     * Busca en: nombre completo, first_name, last_name, DNI, dirección, teléfono
     */
    applySearch(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') return this;

        const tokens = searchTerm.split(/\s+/).filter(t => t.length > 0);

        tokens.forEach(token => {
            const term = `%${token}%`;
            this.orWhere([
                { condition: 'p.full_name LIKE ?', params: term },
                { condition: 'p.first_name LIKE ?', params: term },
                { condition: 'p.last_name LIKE ?', params: term },
                { condition: 'p.dni LIKE ?', params: term },
                { condition: 'p.address LIKE ?', params: term },
                { condition: 'p.phone LIKE ?', params: term }
            ]);
        });

        return this;
    }

    /**
     * Filtra solo pacientes nuevos
     */
    onlyNew() {
        this.where('p.is_new_patient = ?', 1);
        return this;
    }

    /**
     * Filtra por obra social
     */
    filterByInsurance(insuranceId) {
        if (insuranceId) {
            this.where('p.insurance_id = ?', insuranceId);
        }
        return this;
    }

    /**
     * Filtra por institución
     */
    filterByInstitution(institutionId) {
        if (institutionId) {
            this.where('p.institution_id = ?', institutionId);
        }
        return this;
    }

    /**
     * Filtra por comportamiento
     */
    filterByBehavior(rating) {
        if (rating) {
            this.where('p.behavior_rating = ?', rating);
        }
        return this;
    }

    /**
     * Ordena por nombre
     */
    sortByName(direction = 'ASC') {
        this.orderBy('p.full_name', direction);
        return this;
    }

    /**
     * Ordena por fecha de creación
     */
    sortByCreatedAt(direction = 'DESC') {
        this.orderBy('p.created_at', direction);
        return this;
    }

    /**
     * Método de conveniencia para obtener configuración completa
     * Incluye todo lo que normalmente se necesita
     */
    withFullDetails() {
        return this
            .includeInsurance()
            .includeInstitution()
            .includeDebtStats()
            .includeAppointmentStats();
    }
}

module.exports = PatientsQueryBuilder;
