import React from 'react';
import Badge from '../atoms/Badge';

/**
 * InstitutionTransactionsTable Molecule.
 * Renders the list of financial transactions for an institution.
 */
const InstitutionTransactionsTable = ({
    transactions,
    showPendingOnly,
    formatDate,
    t
}) => {
    return (
        <div className="inst-table-container">
            <div className="inst-table-header">
                <h3 className="inst-table-title">
                    📋 {t('transaction_log')}
                    <span className="inst-table-badge">{transactions.length}</span>
                </h3>
            </div>

            <div className="inst-table-wrapper">
                <table className="inst-data-table">
                    <thead>
                        <tr>
                            <th>{t('date_label')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('doctor')}</th>
                            <th className="text-center">{t('status')}</th>
                            <th className="text-center">{t('antiquity')}</th>
                            <th className="text-right">{t('amount')}</th>
                            <th className="text-center">{t('payment')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tr => {
                            const trDate = new Date(tr.transaction_date);
                            const diffDays = Math.ceil(Math.abs(new Date() - trDate) / (1000 * 60 * 60 * 24));
                            const isPending = tr.payment_status === 'pending';

                            return (
                                <tr key={tr.transaction_id} className={isPending ? 'inst-data-table__tr--pending' : ''}>
                                    <td>{formatDate(tr.transaction_date)}</td>
                                    <td>
                                        <a href={`/patients?search=${tr.patient_name}`} className="inst-patient-link">
                                            {tr.patient_name || 'N/A'}
                                        </a>
                                    </td>
                                    <td>{tr.doctor_name || 'N/A'}</td>
                                    <td className="text-center">
                                        <Badge variant={tr.appointment_status === 'completed' ? 'green' : 'gray'}>
                                            {t(tr.appointment_status) || tr.appointment_status}
                                        </Badge>
                                    </td>
                                    <td className="text-center">
                                        {isPending ? (
                                            <span className={`inst-age-badge ${diffDays > 30 ? 'inst-age-badge--critical' : 'inst-age-badge--warning'}`}>
                                                {t('days_count').replace('{days}', diffDays)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="text-right font-mono font-bold">${tr.amount}</td>
                                    <td className="text-center">
                                        <Badge variant={tr.payment_status === 'paid' ? 'green' : 'red'}>
                                            {t(tr.payment_status)}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center py-12 text-slate-400 italic">
                                    {showPendingOnly ? t('no_debts_found') : t('no_movements_found')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstitutionTransactionsTable;
