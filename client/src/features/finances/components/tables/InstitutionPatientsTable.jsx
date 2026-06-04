import Icon from '@/components/atoms/Icon';
import styles from './InstitutionPatientsTable.module.css';

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
        <section className={`${styles.root} animate-fade-in`}>
            <header className={`${styles.header}`}>
                <h3 className={`${styles.title}`}>
                    <Icon name="PATIENTS" size="1.2rem" /> {t('patient_list_padron')}
                    <span className={`${styles.badge}`}>{patients.length}</span>
                </h3>
            </header>

            <div className={`${styles.wrapper}`}>
                <table className={`${styles.table}`}>
                    <thead>
                        <tr>
                            <th>{t('full_name')}</th>
                            <th>{t('dni')}</th>
                            <th className={`${styles.cellCenter}`}>{t('last_visit')}</th>
                            <th className={`${styles.cellRight}`}>{t('tariff_copay')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(patients) && patients.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <a href={`/patients?search=${p.dni}`} className={`${styles.patientLink}`}>
                                        {p.full_name}
                                    </a>
                                </td>
                                <td>{p.dni}</td>
                                <td className={`${styles.cellCenter}`}>{formatDate(p.last_visit_date)}</td>
                                <td className={`${styles.cellRight}`}>
                                    {p.tariff_override ? (
                                        <span className={`${styles.amountBold}`}>${p.tariff_override}</span>
                                    ) : (
                                        <span className={`${styles.textMuted}`}>{p.tariff_percent || 0}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="4" className={`${styles.empty}`}>
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

