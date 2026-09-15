import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatDate, formatTime, formatDateTimeLong } from '@/utils/core/dateUtils';
import styles from './PatientHistoryTable.module.css';

const getStatusClass = (status) => {
    if (!status) return '';
    const key = status.charAt(0).toUpperCase() + status.slice(1);
    return styles[`PatientHistoryTable__status${key}`] || '';
};

/**
 * PatientHistoryTable (Executor).
 * Renders the appointment and payment history for a specific patient.
 */
export const PatientHistoryTable = ({ details, t, onPayDebt }) => {
    return (
        <section className={`${styles.PatientHistoryTable__detailsBlock} ${styles.PatientHistoryTable__detailsBlockHistory}`}>
            <header className={styles.PatientHistoryTable__header}>
                <h3 className={styles.PatientHistoryTable__title}>
                    <Icon name="calendar_month" size="1.2rem" />
                    <span>{t('appointment_history')}</span>
                </h3>
            </header>
            <div className={styles.PatientHistoryTable__content}>
                {details.appointments && details.appointments.length > 0 ? (
                    <div className={styles.PatientHistoryTable__historyContainer}>
                        <table className={styles.PatientHistoryTable__historyTable}>
                            <thead className={styles.PatientHistoryTable__historyHeader}>
                                <tr>
                                    <th className={styles.PatientHistoryTable__historyTh}>{t('appointment_date')}</th>
                                    <th className={styles.PatientHistoryTable__historyTh}>{t('appointment_doctor')}</th>
                                    <th className={styles.PatientHistoryTable__historyTh}>{t('appointment_status')}</th>
                                    <th className={styles.PatientHistoryTable__historyTh}>{t('appointment_payment')}</th>
                                    <th className={styles.PatientHistoryTable__historyTh}>{t('appointment_balance')}</th>
                                    <th className={styles.PatientHistoryTable__historyTh}>{t('appointment_reason')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {details.appointments.map(app => {
                                    const isPaid = app.is_paid === 1 || app.payment_status === 'paid';
                                    const costVal = Number(app.cost || app.price || 0);
                                    const paidVal = isPaid ? costVal : Number(app.amount_paid || app.paid_amount || 0);
                                    const pendingVal = isPaid ? 0 : Math.max(0, costVal - paidVal);

                                    return (
                                        <tr key={app.id} className={styles.PatientHistoryTable__historyRow}>
                                            <td className={styles.PatientHistoryTable__historyCell}>
                                                <div className={styles.PatientHistoryTable__tableCellDateBox}>
                                                    <div className={styles.PatientHistoryTable__tableCellDateMain}>{formatDate(app.appointment_date)}</div>
                                                    <div className={styles.PatientHistoryTable__tableCellDateSub}>
                                                        {formatTime(app.appointment_date)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={styles.PatientHistoryTable__historyCell}>{app.doctor_name || '—'}</td>
                                            <td className={styles.PatientHistoryTable__historyCell}>
                                                <span className={`${styles.PatientHistoryTable__statusTag} ${getStatusClass(app.status)}`}>
                                                    {t(app.status) || app.status}
                                                </span>
                                            </td>
                                            <td className={`${styles.PatientHistoryTable__historyCell} ${isPaid ? styles.PatientHistoryTable__historyCellSuccess : ''} ${styles.PatientHistoryTable__tableCellBold}`}>
                                                {isPaid ? `$${costVal.toLocaleString()}` : (paidVal > 0 ? `$${paidVal.toLocaleString()}` : '$0')}
                                            </td>
                                            <td className={styles.PatientHistoryTable__historyCell}>
                                                <div className={`${styles.PatientHistoryTable__tableCellBold} ${pendingVal > 0 ? styles.PatientHistoryTable__tableCellBoldDanger : styles.PatientHistoryTable__tableCellBoldMuted}`}>
                                                    {pendingVal > 0 ? `$${pendingVal.toLocaleString()}` : '$0'}
                                                    {pendingVal > 0 && (
                                                        <div className={styles.PatientHistoryTable__payAction}>
                                                            <Button
                                                                size="sm-compact"
                                                                variant="action-pay"
                                                                onClick={() => onPayDebt(null, details.id, pendingVal)}
                                                                title={t('pay')}
                                                                icon={<Icon name="payments" size="0.9rem" />}
                                                            >
                                                                {t('pay')}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={styles.PatientHistoryTable__historyCell}>
                                                <div className={styles.PatientHistoryTable__tableCellReason}>
                                                    {app.reason}
                                                    {app.cancellation_reason && (
                                                        <div className={styles.PatientHistoryTable__cancelReason}>
                                                            <Icon name="block" size="0.8rem" />
                                                            <span>{app.cancellation_reason}</span>
                                                        </div>
                                                    )}
                                                    {app.rescheduled_from_date && (
                                                        <div
                                                            className={styles.PatientHistoryTable__rescheduleInfo}
                                                            title={`${t('originally_for')} ${formatDateTimeLong(app.rescheduled_from_date)}`}
                                                            suppressHydrationWarning
                                                        >
                                                            <Icon name="history" size="0.8rem" />
                                                            <span>{t('rescheduled_from')}: {formatDate(app.rescheduled_from_date)}</span>
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
                    <div className={styles.PatientHistoryTable__historyEmptyState}>
                        {t('no_history')}
                    </div>
                )}
            </div>
        </section>
    );
};
