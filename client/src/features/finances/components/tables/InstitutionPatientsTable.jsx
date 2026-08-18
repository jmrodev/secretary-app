import { Icon } from '@/components/atoms/Icon';
import styles from './InstitutionPatientsTable.module.css';

/**
 * InstitutionPatientsTable Molecule.
 * Renders the roster of patients associated with an institution.
 */
export const InstitutionPatientsTable = ({
    patients,
    formatDate,
    t
}) => {
    return (
        <section className={`${styles.InstitutionPatientsTable__root} animate-fade-in`}>
            <header className={`${styles.InstitutionPatientsTable__header}`}>
                <h3 className={`${styles.InstitutionPatientsTable__title}`}>
                    <Icon name="PATIENTS" size="1.2rem" /> {t('patient_list_padron')}
                    <span className={`${styles.InstitutionPatientsTable__badge}`}>{patients.length}</span>
                </h3>
            </header>

            <div className={`${styles.InstitutionPatientsTable__wrapper}`}>
                <table className={`${styles.InstitutionPatientsTable__table}`}>
                    <thead>
                        <tr>
                            <th>{t('full_name')}</th>
                            <th>{t('dni')}</th>
                            <th className={`${styles.InstitutionPatientsTable__cellCenter}`}>{t('last_visit')}</th>
                            <th className={`${styles.InstitutionPatientsTable__cellRight}`}>{t('tariff_copay')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(patients) && patients.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <a href={`/patients?search=${p.dni}`} className={`${styles.InstitutionPatientsTable__patientLink}`}>
                                        {p.full_name}
                                    </a>
                                </td>
                                <td>{p.dni}</td>
                                <td className={`${styles.InstitutionPatientsTable__cellCenter}`}>{formatDate(p.last_visit_date)}</td>
                                <td className={`${styles.InstitutionPatientsTable__cellRight}`}>
                                    {p.tariff_override ? (
                                        <span className={`${styles.InstitutionPatientsTable__amountBold}`}>${p.tariff_override}</span>
                                    ) : (
                                        <span className={`${styles.InstitutionPatientsTable__textMuted}`}>{p.tariff_percent || 0}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="4" className={`${styles.InstitutionPatientsTable__empty}`}>
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

