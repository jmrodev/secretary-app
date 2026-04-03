import React from 'react';
import Icon from '../../../components/atoms/Icon';

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
        <div className="inst-table-container animate-fadeIn">
            <div className="inst-table-header">
                <h3 className="inst-table-title">
                    <Icon name="groups" /> {t('patient_list_padron')}
                    <span className="inst-table-badge">{patients.length}</span>
                </h3>
            </div>

            <div className="inst-table-wrapper">
                <table className="inst-data-table">
                    <thead>
                        <tr>
                            <th>{t('full_name')}</th>
                            <th>{t('dni')}</th>
                            <th align="center">{t('last_visit')}</th>
                            <th align="right">{t('tariff_copay')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patients.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <a href={`/patients?search=${p.dni}`} className="inst-patient-link">
                                        {p.full_name}
                                    </a>
                                </td>
                                <td className="inst-data-table__mono-xs">{p.dni}</td>
                                <td align="center">{formatDate(p.last_visit_date)}</td>
                                <td align="right">
                                    {p.tariff_override ? (
                                        <span className="inst-data-table__amount-override">${p.tariff_override}</span>
                                    ) : (
                                        <span className="inst-data-table__percent">{p.tariff_percent || 0}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="4" className="inst-data-table__empty">
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
