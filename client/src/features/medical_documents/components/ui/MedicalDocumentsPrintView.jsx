import React from 'react';
import { formatDate } from '@/utils/core/dateUtils';

/**
 * MedicalDocumentsPrintView Molecule.
 * Renders the printable version of medical documents and requests.
 * Isolated to reduce main page complexity.
 */
export const MedicalDocumentsPrintView = ({ printData, printDate, t }) => {
    if (!printData || printData.length === 0) return null;

    return (
        <div className="medical-documents__print-container">
            <header className="medical-documents__print-header">
                <h1 className="medical-documents__print-title">
                    {t('prescription_requests_report')}
                </h1>
                {printDate && (
                    <p className="medical-documents__print-date">
                        {t('generated_at', { date: printDate })}
                    </p>
                )}
            </header>

            <table className="print-table">
                <thead>
                    <tr>
                        <th>{t('date_label')}</th>
                        <th>{t('patient')}</th>
                        <th>{t('doctor')}</th>
                        <th>{t('origin')}</th>
                        <th>{t('payment')}</th>
                        <th>{t('detail_meds')}</th>
                    </tr>
                </thead>
                <tbody>
                    {printData.map((item) => (
                        <tr key={item.id || item.created_at}>
                            <td>{formatDate(item.date)}</td>
                            <td className="print-table__cell--bold">{item.patient_name}</td>
                            <td>{item.doctor_name}</td>
                            <td>
                                {item.source_type === 'direct' ? t('consult') : t('request')}
                            </td>
                            <td>
                                {item.source_type === 'request' ? (
                                    <span className={`status-chip status-${item.payment_status}`}>
                                        {item.payment_status === 'paid' ? t('paid').toUpperCase() :
                                            item.payment_status === 'debt' ? t('debt').toUpperCase() :
                                                item.payment_status === 'bonified' ? (t('bonified')).toUpperCase() : item.payment_status}
                                        {item.amount > 0 && ` $${item.amount}`}
                                    </span>
                                ) : '-'}
                            </td>
                            <td>
                                <div className="config-flex--column">
                                    <span className="print-table__cell--mono">{item.medications}</span>
                                    {item.instructions && <span className="print-table__cell--muted">{item.instructions}</span>}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

