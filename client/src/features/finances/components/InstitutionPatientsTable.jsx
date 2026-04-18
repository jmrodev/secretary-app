import Icon from '@/components/atoms/Icon';
import './InstitutionPatientsTable.css';

/**
 * InstitutionPatientsTable Molecule.
 * Renders the roster of patients associated with an institution.
 */
const InstitutionPatientsTable = ({
    patients,
    formatDate,
    t
}) => {
    return (
        <section className="institution-patients animate-fadeIn">
            <header className="institution-patients__header">
                <h3 className="institution-patients__title">
                    <Icon name="PATIENTS" size="1.2rem" /> {t('patient_list_padron')}
                    <span className="institution-patients__badge">{patients.length}</span>
                </h3>
            </header>

            <div className="institution-patients__wrapper">
                <table className="institution-patients__table">
                    <thead>
                        <tr>
                            <th>{t('full_name')}</th>
                            <th>{t('dni')}</th>
                            <th className="institution-patients__cell--center">{t('last_visit')}</th>
                            <th className="institution-patients__cell--right">{t('tariff_copay')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(patients) && patients.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <a href={`/patients?search=${p.dni}`} className="institution-patients__patient-link">
                                        {p.full_name}
                                    </a>
                                </td>
                                <td>{p.dni}</td>
                                <td className="institution-patients__cell--center">{formatDate(p.last_visit_date)}</td>
                                <td className="institution-patients__cell--right">
                                    {p.tariff_override ? (
                                        <span className="institution-patients__amount-bold">${p.tariff_override}</span>
                                    ) : (
                                        <span className="institution-patients__text-muted">{p.tariff_percent || 0}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="4" className="institution-patients__empty">
                                    {t('no_patients_found')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default InstitutionPatientsTable;

