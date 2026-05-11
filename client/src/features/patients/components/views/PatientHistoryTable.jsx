
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { formatDate, formatTime } from '@/utils/core/dateUtils';

// Local Styles
import './PatientHistoryTable.css';

/**
 * PatientHistoryTable (Executor).
 * Renders the appointment and payment history for a specific patient.
 */
const PatientHistoryTable = ({ details, t, onPayDebt }) => {
    return (
        <section className="patient-details__block patient-details__block--history">
            <header className="patient-details__block-header">
                <h3 className="patient-details__block-title">
                    <Icon name="calendar_month" size="1.2rem" />
                    {t('appointment_history')}
                </h3>
            </header>
            <div className="patient-details__block-content">
                {details.appointments && details.appointments.length > 0 ? (
                    <div className="patient-details__history-container">
                        <table className="patient-details__history-table">
                            <thead className="patient-details__history-header">
                                <tr>
                                    <th className="patient-details__history-th">{t('appointment_date')}</th>
                                    <th className="patient-details__history-th">{t('appointment_doctor')}</th>
                                    <th className="patient-details__history-th">{t('appointment_status')}</th>
                                    <th className="patient-details__history-th">{t('appointment_payment')}</th>
                                    <th className="patient-details__history-th">{t('appointment_balance')}</th>
                                    <th className="patient-details__history-th">{t('appointment_reason')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.appointments.map(app => (
                                    <tr key={app.id} className="patient-details__history-row">
                                        <td className="patient-details__history-cell">
                                            <div className="patient-details__table-cell-date-box">
                                                <div className="patient-details__table-cell-date-main">{formatDate(app.appointment_date)}</div>
                                                <div className="patient-details__table-cell-date-sub">
                                                    {formatTime(app.appointment_date)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="patient-details__history-cell">{app.doctor_name}</td>
                                        <td className="patient-details__history-cell">
                                            <span className={`patient-details__status-tag status-${app.status}`}>
                                                {t(app.status) || app.status}
                                            </span>
                                        </td>
                                        <td className="patient-details__history-cell patient-details__history-cell--success patient-details__table-cell-bold">
                                            {Number(app.paid_amount) > 0 ? `$${app.paid_amount}` : '-'}
                                        </td>
                                        <td className="patient-details__history-cell">
                                            <div className={`patient-details__table-cell-bold ${Number(app.pending_amount) > 0 ? 'patient-details__table-cell-bold--danger' : 'patient-details__table-cell-bold--muted'}`}>
                                                {Number(app.pending_amount) > 0 ? `$${app.pending_amount}` : '$0'}
                                                {Number(app.pending_amount) > 0 && (
                                                    <div className="patient-details__pay-action">
                                                        <Button
                                                            size="sm-compact"
                                                            variant="ghost"
                                                            className="patient-details__pay-btn-mini"
                                                            onClick={() => onPayDebt(null, details.id, app.pending_amount)}
                                                            icon={<Icon name="payments" size="0.8rem" />}
                                                        >
                                                            {t('pay')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="patient-details__history-cell">
                                            <div className="patient-details__table-cell-reason">
                                                {app.reason}
                                                {app.cancellation_reason && (
                                                    <div className="patient-details__cancel-reason">
                                                        <Icon name="block" size="0.8rem" />
                                                        {app.cancellation_reason}
                                                    </div>
                                                )}
                                                {app.rescheduled_from_date && (
                                                    <div className="patient-details__reschedule-info" title={`Originalmente para ${new Date(app.rescheduled_from_date).toLocaleString()}`}>
                                                        <Icon name="history" size="0.8rem" />
                                                        {t('rescheduled_from')}: {formatDate(app.rescheduled_from_date)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="history-empty-state">
                        {t('no_history')}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PatientHistoryTable;
