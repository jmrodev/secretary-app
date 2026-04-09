
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { formatDate, formatTime } from '@/utils/dateUtils';

/**
 * PatientHistoryTable (Executor).
 * Renders the appointment and payment history for a specific patient.
 */
const PatientHistoryTable = ({ details, t, onPayDebt }) => {
    return (
        <section className="details-block details-block--history">
            <header className="details-block__header">
                <h3 className="details-block__title">
                    <Icon name="calendar_month" size="1.2rem" />
                    {t('appointment_history')}
                </h3>
            </header>
            <div className="details-block__content">
                {details.appointments && details.appointments.length > 0 ? (
                    <div className="patient-details__history-container">
                        <table className="patient-details__history-table">
                            <thead className="patient-details__history-header">
                                <tr>
                                    <th>{t('appointment_date')}</th>
                                    <th>{t('appointment_doctor')}</th>
                                    <th>{t('appointment_status')}</th>
                                    <th>{t('appointment_payment')}</th>
                                    <th>{t('appointment_balance')}</th>
                                    <th>{t('appointment_reason')}</th>
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
                                        <td className="patient-details__history-cell text-success patient-details__table-cell-bold">
                                            {Number(app.paid_amount) > 0 ? `$${app.paid_amount}` : '-'}
                                        </td>
                                        <td className="patient-details__history-cell">
                                            <div className={`patient-details__table-cell-bold ${Number(app.pending_amount) > 0 ? 'text-danger' : 'text-muted'}`}>
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
                                                        <Icon name="block" size="0.8rem" className="mr-1" />
                                                        {app.cancellation_reason}
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
