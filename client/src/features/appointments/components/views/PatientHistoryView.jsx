import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { Loading } from '@/components/atoms/Loading';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import styles from './PatientHistoryView.module.css';

/**
 * PatientHistoryView (Executor Component).
 * Renders appointment search results as a compact, high-density list/table.
 */
export const PatientHistoryView = ({ patientAppointments, loading, onClose, t, searchPatientId: _searchPatientId, handlers }) => {
    const { t: tLocal } = useLanguage();
    const translate = t || tLocal;

    if (loading) return <Loading />;

    if (!patientAppointments || patientAppointments.length === 0) {
        return (
            <div className={`${styles.PatientHistoryView__empty}`}>
                <Icon name="history_off" size="3rem" className={`${styles.PatientHistoryView__emptyIcon}`} />
                <h3 className={`${styles.PatientHistoryView__emptyTitle}`}>{translate('no_history_found')}</h3>
                <Button onClick={onClose} variant="ghost">{translate('back')}</Button>
            </div>
        );
    }

    const patientName = patientAppointments[0]?.patient_name || translate('patient');

    return (
        <div className={`${styles.PatientHistoryView__root}`}>
            <header className={`${styles.PatientHistoryView__header}`}>
                <div className={`${styles.PatientHistoryView__headerInfo}`}>
                    <h2 className={`${styles.PatientHistoryView__title}`}>
                        <Icon name="person_search" size="1.2rem" />
                        {patientName}
                    </h2>
                    <span className={`${styles.PatientHistoryView__count}`}>
                        {patientAppointments.length} {translate('appointments') || 'turnos'}
                    </span>
                </div>
                <Button
                    onClick={onClose}
                    variant="ghost"
                    size="sm-compact"
                    icon={<Icon name="close" size="1.1rem" />}
                    title={translate('back')}
                />
            </header>

            <div className={`${styles.PatientHistoryView__tableWrapper}`}>
                <table className={`${styles.PatientHistoryView__table} table-base`}>
                    <thead>
                        <tr>
                            <th className={`${styles.PatientHistoryView__th}`}>{translate('date')}</th>
                            <th className={`${styles.PatientHistoryView__th}`}>{translate('time') || 'Hora'}</th>
                            <th className={`${styles.PatientHistoryView__th}`}>{translate('doctor')}</th>
                            <th className={`${styles.PatientHistoryView__th}`}>{translate('reason') || 'Motivo'}</th>
                            <th className={`${styles.PatientHistoryView__th} ${styles.PatientHistoryView__thStatus}`}>{translate('status')}</th>
                            <th className={`${styles.PatientHistoryView__th} ${styles.PatientHistoryView__thPayment}`}>{translate('payment')}</th>
                            <th className={`${styles.PatientHistoryView__th} ${styles.PatientHistoryView__thActions}`}>{translate('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patientAppointments.map(appt => {
                            const paid = Number(appt.paid_amount || 0);
                            const pending = Number(appt.pending_amount || 0);
                            const cost = Number(appt.cost || 0);
                            const instBasePrice = Number(appt.institution_base_price || 0);
                            const txTotal = paid + pending;
                            const effectiveTotal = txTotal > 0 ? txTotal : (cost > 0 ? cost : instBasePrice);
                            const isBonified = appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true';
                            const isFullyPaid = paid >= effectiveTotal && effectiveTotal > 0;
                            const hasDebt = pending > 0 || (!txTotal && cost > 0);

                            let paymentClass = 'pending';
                            let paymentLabel = translate('pending');
                            if (isBonified) { paymentClass = 'bonified'; paymentLabel = translate('bonified') || 'Bonif.'; }
                            else if (isFullyPaid) { paymentClass = 'paid'; paymentLabel = `$${paid.toLocaleString()}`; }
                            else if (hasDebt) { paymentClass = 'debt'; paymentLabel = `$${(pending || cost).toLocaleString()}`; }
                            else if (effectiveTotal === 0) { paymentClass = ''; paymentLabel = '-'; }

                            return (
                                <tr
                                    key={appt.id}
                                    className={`${styles.PatientHistoryView__row} ${styles['row' + appt.status.charAt(0).toUpperCase() + appt.status.slice(1)]}`}
                                    onClick={() => handlers.handleOpenAction(appt)}
                                    title={translate('view')}
                                >
                                    <td className={`${styles.PatientHistoryView__td}`}>
                                        {formatDate(appt.appointment_date)}
                                    </td>
                                    <td className={`${styles.PatientHistoryView__td} ${styles.PatientHistoryView__tdTime}`}>
                                        {formatTime(appt.appointment_date, { hour12: false })}
                                    </td>
                                    <td className={`${styles.PatientHistoryView__td} ${styles.PatientHistoryView__tdDoctor}`}>
                                        {appt.doctor_name ? `Dr. ${appt.doctor_name.split(' ').pop()}` : '-'}
                                    </td>
                                    <td className={`${styles.PatientHistoryView__td} ${styles.PatientHistoryView__tdReason}`}>
                                        <span title={appt.reason}>{appt.reason || '-'}</span>
                                        {appt.type === 'virtual' && (
                                            <Icon name="videocam" size="0.9rem" className={styles.PatientHistoryView__virtualIcon} title="Virtual" />
                                        )}
                                    </td>
                                    <td className={`${styles.PatientHistoryView__td}`}>
                                        <span className={`${styles.PatientHistoryView__statusChip} ${styles['statusChip' + appt.status.charAt(0).toUpperCase() + appt.status.slice(1)]}`}>
                                            {translate(appt.status) || appt.status}
                                        </span>
                                    </td>
                                    <td className={`${styles.PatientHistoryView__td}`}>
                                        {paymentLabel !== '-' ? (
                                            <span className={`${styles.PatientHistoryView__paymentBadge} ${styles['paymentBadge' + paymentClass.charAt(0).toUpperCase() + paymentClass.slice(1)]}`}>
                                                {paymentLabel}
                                            </span>
                                        ) : <span className={styles.PatientHistoryView__tdMuted}>-</span>}
                                    </td>
                                    <td className={`${styles.PatientHistoryView__td}`} onClick={e => e.stopPropagation()}>
                                        {appt.patient_phone && (
                                            <Button
                                                to={`tel:${String(appt.patient_phone).replace(/[^0-9+]/g, '')}`}
                                                variant="ghost"
                                                size="sm-compact"
                                                icon={<Icon name="call" size="1rem" />}
                                                title={appt.patient_phone}
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

