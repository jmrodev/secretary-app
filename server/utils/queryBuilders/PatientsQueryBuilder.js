const BaseQueryBuilder = require('./BaseQueryBuilder');

/**
 * PatientsQueryBuilder - Constructor de queries para la entidad Patients
 * Utiliza la vista view_patients_extended para obtener estadísticas pre-calculadas.
 */
class PatientsQueryBuilder extends BaseQueryBuilder {
    constructor(user) {
        // Cambiamos el origen a la vista extendida
        super('view_patients_extended p', user);

        // Campos base (incluyendo los calculados por la vista)
        this.select([
            'p.*'
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
     * Aplica búsqueda por texto
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
                { condition: 'p.street_name LIKE ?', params: term },
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
     * Ordena por deuda
     */
    sortByDebt() {
        this.orderByClause = `ORDER BY total_debt_calculated DESC, p.full_name ASC`;
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
