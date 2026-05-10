const BaseQueryBuilder = require('./BaseQueryBuilder');

/**
 * PatientsQueryBuilder - Constructor de queries para la entidad Patients
 * Utiliza la vista view_patients_extended para obtener estadísticas pre-calculadas.
 */
class PatientsQueryBuilder extends BaseQueryBuilder {
    constructor(user) {
        // Usamos la tabla base patients para habilitar FULLTEXT search
        super('patients p', user);

        // Joins necesarios para replicar view_patients_extended
        this.leftJoin('users u', 'p.user_id = u.id');
        this.leftJoin('view_patient_balances b', 'p.id = b.patient_id');
        this.leftJoin(`(
            SELECT 
                patient_id,
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status IN ('attended', 'completed') THEN 1 END) as attended_appointments,
                COUNT(CASE WHEN (status = 'absent' OR (status = 'cancelled' AND COALESCE(cancellation_reason, '') NOT LIKE '%error%')) THEN 1 END) as missed_appointments,
                MAX(appointment_date) as last_visit
            FROM appointments
            GROUP BY patient_id
        ) appt_stats`, 'appt_stats.patient_id = p.id');

        // Campos base incluyendo los calculados
        this.select([
            'p.*',
            'u.username',
            'u.role',
            'COALESCE(appt_stats.total_appointments, 0) as total_appointments',
            'COALESCE(appt_stats.attended_appointments, 0) as attended_appointments',
            'COALESCE(appt_stats.missed_appointments, 0) as missed_appointments',
            'appt_stats.last_visit',
            'COALESCE(b.total_debt_calculated, 0) as total_debt_calculated',
            'COALESCE(b.debt_status, "green") as debt_status',
            'b.oldest_debt_days',
            `CASE 
                WHEN COALESCE(b.total_debt_calculated, 0) <= 0 THEN 5
                WHEN b.total_debt_calculated < 1000 THEN 4
                WHEN b.total_debt_calculated < 5000 THEN 3
                WHEN b.total_debt_calculated < 10000 THEN 2
                ELSE 1 
            END as financial_rating`
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
     * Filtra por doctor (asignación en patient_doctors)
     */
    filterByDoctor(doctorId) {
        if (doctorId) {
            this.innerJoin('patient_doctors pd', 'p.id = pd.patient_id');
            this.where('pd.doctor_id = ?', doctorId);
        }
        return this;
    }

    /**
     * Aplica búsqueda por texto utilizando FULLTEXT INDEX y coincidencia fonética (Fuzzy)
     */
    applySearch(searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') return this;

        const tokens = searchTerm.trim().split(/\s+/).filter(t => t.length > 0);
        const booleanQuery = tokens.map(t => `+${t}*`).join(' ');
        const soundexQuery = tokens.join(' ');

        // Agregamos una columna calculada de relevancia para el ORDER BY
        // 10 puntos por MATCH exacto/prefijo, 5 puntos por sonido similar
        this.select([
            `(MATCH(p.full_name, p.dni, p.phone) AGAINST(? IN BOOLEAN MODE) * 10 + 
              IF(p.full_name SOUNDS LIKE ?, 5, 0)) as search_relevance`
        ], [booleanQuery, soundexQuery]);

        this.where('(MATCH(p.full_name, p.dni, p.phone) AGAINST(? IN BOOLEAN MODE) OR p.full_name SOUNDS LIKE ? OR p.full_name LIKE ? OR p.dni LIKE ?)', 
            booleanQuery, soundexQuery, `%${searchTerm}%`, `%${searchTerm}%`);

        // Priorizar por relevancia de búsqueda antes que por deuda
        this.orderByClause = `ORDER BY search_relevance DESC, total_debt_calculated DESC, p.full_name ASC`;

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
     * Ordena por deuda
     */
    sortByDebt() {
        this.orderByClause = `ORDER BY total_debt_calculated DESC, p.full_name ASC`;
        return this;
    }

    /**
     * Filtra pacientes con deuda mayor a 0
     */
    onlyWithDebt() {
        this.where('p.total_debt_calculated > 0');
        return this;
    }

    /**
     * Filtra por estado de riesgo financiero (green, yellow, red)
     */
    filterByRiskStatus(status) {
        if (status) {
            this.where('p.debt_status = ?', status);
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
     * Conveniencia para detalles completos
     */
    withFullDetails() {
        return this
            .includeInsurance()
            .includeInstitution();
    }
}

module.exports = PatientsQueryBuilder;
