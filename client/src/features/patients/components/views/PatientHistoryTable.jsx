
import React from 'react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatDate, formatTime, formatDateTimeLong } from '@/utils/core/dateUtils';

// Local Styles
import styles from './PatientHistoryTable.module.css';

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
                    <div className={`${styles.historyContainer}`}>
                        <table className={`${styles.historyTable}`}>
                            <thead className={`${styles.historyHeader}`}>
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
                                {details.appointments.map(app => {
                                    const isPaid = app.is_paid === 1 || app.payment_status === 'paid';
                                    const costVal = Number(app.cost || app.price || 0);
                                    const paidVal = isPaid ? costVal : Number(app.amount_paid || app.paid_amount || 0);
                                    const pendingVal = isPaid ? 0 : Math.max(0, costVal - paidVal);

                                    return (
                                        <tr key={app.id} className={`${styles.historyRow}`}>
                                            <td className={`${styles.historyCell}`}>
                                                <div className={`${styles.tableCellDateBox}`}>
                                                    <div className={`${styles.tableCellDateMain}`}>{formatDate(app.appointment_date)}</div>
                                                    <div className={`${styles.tableCellDateSub}`}>
                                                        {formatTime(app.appointment_date)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`${styles.historyCell}`}>{app.doctor_name || '—'}</td>
                                            <td className={`${styles.historyCell}`}>
                                                <span className={`${styles.statusTag} status-${app.status}`}>
                                                    {t(app.status) || app.status}
                                                </span>
                                            </td>
                                            <td className={`${styles.historyCell} ${isPaid ? styles.historyCellSuccess : ''} ${styles.tableCellBold}`}>
                                                {isPaid ? `$${costVal.toLocaleString()}` : (paidVal > 0 ? `$${paidVal.toLocaleString()}` : '-')}
                                            </td>
                                            <td className={`${styles.historyCell}`}>
                                                <div className={`${styles.tableCellBold} ${pendingVal > 0 ? styles.tableCellBoldDanger : styles.tableCellBoldMuted}`}>
                                                    {pendingVal > 0 ? `$${pendingVal.toLocaleString()}` : '$0'}
                                                    {pendingVal > 0 && (
                                                        <div className={`${styles.payAction}`}>
                                                            <Button
                                                                size="sm-compact"
                                                                variant="ghost"
                                                                className={`${styles.payBtnMini}`}
                                                                onClick={() => onPayDebt(null, details.id, pendingVal)}
                                                                icon={<Icon name="payments" size="0.8rem" />}
                                                            >
                                                                {t('pay') || 'Pagar'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        <td className={`${styles.historyCell}`}>
                                            <div className={`${styles.tableCellReason}`}>
                                                {app.reason}
                                                {app.cancellation_reason && (
                                                    <div className={`${styles.cancelReason}`}>
                                                        <Icon name="block" size="0.8rem" />
                                                        {app.cancellation_reason}
                                                    </div>
                                                )}
                                                {app.rescheduled_from_date && (
                                                    <div 
                                                        className={`${styles.rescheduleInfo}`} 
                                                        title={`${t('originally_for') || 'Originalmente para'} ${formatDateTimeLong(app.rescheduled_from_date)}`}
                                                        suppressHydrationWarning
                                                    >
                                                        <Icon name="history" size="0.8rem" />
                                                        {t('rescheduled_from')}: {formatDate(app.rescheduled_from_date)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={`${styles.historyEmptyState}`}>
                        {t('no_history')}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PatientHistoryTable;
