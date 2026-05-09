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
        ]);
        this.params.push(booleanQuery, soundexQuery);

        this.where('(MATCH(p.full_name, p.dni, p.phone) AGAINST(? IN BOOLEAN MODE) OR p.full_name SOUNDS LIKE ?)', 
            [booleanQuery, soundexQuery]);

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
