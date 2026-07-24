const BaseQueryBuilder = require('./BaseQueryBuilder');

/**
 * PatientsQueryBuilder - Constructor de queries para la entidad Patients
 */
class PatientsQueryBuilder extends BaseQueryBuilder {
    constructor(user) {
        // Usamos la tabla base patients para habilitar FULLTEXT search
        super('patients p', user);

        // Joins necesarios para replicar estadísticas
        this.leftJoin('users u', 'p.user_id = u.id');
        this.leftJoin('view_patient_balances b', 'p.id = b.patient_id');
        this.leftJoin(`(
            SELECT 
                patient_id,
                COUNT(*) as total_appointments,
                COUNT(CASE WHEN status IN ('attended', 'completed', 'arrived') THEN 1 END) as attended_appointments,
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
            'COALESCE(b.debt_status, \'green\') as debt_status',
            'b.oldest_debt_days',
            `CASE 
                WHEN COALESCE(b.total_debt_calculated, 0) <= 0 THEN 5
                WHEN b.total_debt_calculated < 1000 THEN 4
                WHEN b.total_debt_calculated < 5000 THEN 3
                WHEN b.total_debt_calculated < 10000 THEN 2
                ELSE 1 
            END as financial_rating`,
            `CASE 
                WHEN COALESCE(appt_stats.total_appointments, 0) = 0 THEN 5
                WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.95 THEN 5
                WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.85 THEN 4
                WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.70 THEN 3
                WHEN (appt_stats.total_appointments - appt_stats.missed_appointments) / appt_stats.total_appointments >= 0.50 THEN 2
                ELSE 1 
            END as attendance_rating`
        ]);
    }

    includeInsurance() {
        this.leftJoin('insurances i', 'p.insurance_id = i.id');
        this.select('i.name as insurance_name');
        return this;
    }

    includeInstitution() {
        this.leftJoin('institutions inst', 'p.institution_id = inst.id');
        this.select('inst.name as institution_name');
        return this;
    }

    filterByDoctor(doctorId) {
        if (doctorId) {
            this.innerJoin('patient_doctors pd', 'p.id = pd.patient_id');
            this.where('pd.doctor_id = ?', doctorId);
        }
        return this;
    }

    withFullDetails() {
        return this
            .includeInsurance()
            .includeInstitution();
    }
}

module.exports = PatientsQueryBuilder;
