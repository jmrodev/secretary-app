import React from 'react';
import Icon from '@/components/atoms/Icon';

/**
 * InstitutionPatientsTable Molecule.
 * Renders the roster of patients associated with an institution.
 * Follows BEM naming for institution-finances component namespace.
 */
const InstitutionPatientsTable = ({
    patients,
    formatDate,
    t
}) => {
    return (
        <div className="institution-finances__table-container animate-fadeIn">
            <div className="institution-finances__table-header">
                <h3 className="institution-finances__table-title">
                    <Icon name="PATIENTS" size="1.2rem" /> {t('patient_list_padron')}
                    <span className="institution-finances__table-badge">{patients.length}</span>
                </h3>
            </div>

            <div className="institution-finances__table-wrapper">
                <table className="institution-finances__table">
                    <thead>
                        <tr>
                            <th>{t('full_name')}</th>
                            <th>{t('dni')}</th>
                            <th className="institution-finances__cell--center">{t('last_visit')}</th>
                            <th className="institution-finances__cell--right">{t('tariff_copay')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <a href={`/patients?search=${p.dni}`} className="institution-finances__patient-link">
                                        {p.full_name}
                                    </a>
                                </td>
                                <td>{p.dni}</td>
                                <td className="institution-finances__cell--center">{formatDate(p.last_visit_date)}</td>
                                <td className="institution-finances__cell--right">
                                    {p.tariff_override ? (
                                        <span className="institution-finances__amount-bold">${p.tariff_override}</span>
                                    ) : (
                                        <span className="institution-finances__text-muted">{p.tariff_percent || 0}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="4" className="institution-finances__empty">
                                    {t('no_patients_found')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstitutionPatientsTable;

