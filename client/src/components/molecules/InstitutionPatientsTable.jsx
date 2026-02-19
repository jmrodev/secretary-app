import React from 'react';

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
        <div className="inst-table-container">
            <div className="inst-table-header">
                <h3 className="inst-table-title">
                    👥 {t('patient_list_padron')}
                    <span className="inst-table-badge">{patients.length}</span>
                </h3>
            </div>

            <div className="inst-table-wrapper">
                <table className="inst-data-table">
                    <thead>
                        <tr>
                            <th>{t('full_name')}</th>
                            <th>{t('dni')}</th>
                            <th className="text-center">{t('last_visit')}</th>
                            <th className="text-right">{t('tariff_copay')}</th>
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
                                <td className="font-mono text-xs">{p.dni}</td>
                                <td className="text-center">{formatDate(p.last_visit_date)}</td>
                                <td className="text-right">
                                    {p.tariff_override ? (
                                        <span className="font-bold text-blue-600">${p.tariff_override}</span>
                                    ) : (
                                        <span className="text-slate-500">{p.tariff_percent || 0}%</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {patients.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-12 text-slate-400 italic">
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
