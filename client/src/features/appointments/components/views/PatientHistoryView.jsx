import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Loading from '@/components/atoms/Loading';
import { formatDate } from '@/utils/core/dateUtils';
import './PatientHistoryView.css';

/**
 * PatientHistoryView (Executor Component).
 * Renders appointment search results as a compact, high-density list/table.
 */
const PatientHistoryView = ({ patientAppointments, loading, onClose, t, searchPatientId, handlers }) => {
    const { t: tLocal } = useLanguage();
    const translate = t || tLocal;

    if (loading) return <Loading />;

    if (!patientAppointments || patientAppointments.length === 0) {
        return (
            <div className="patient-history-view__empty">
                <Icon name="history_off" size="3rem" className="patient-history-view__empty-icon" />
                <h3 className="patient-history-view__empty-title">{translate('no_history_found')}</h3>
                <Button onClick={onClose} variant="ghost" className="patient-history-view__empty-button">{translate('back')}</Button>
            </div>
        );
    }

    const patientName = patientAppointments[0]?.patient_name || translate('patient');

    return (
        <div className="patient-history-view">
            <header className="patient-history-view__header">
                <div className="patient-history-view__header-info">
                    <h2 className="patient-history-view__title">
                        <Icon name="person_search" size="1.2rem" />
                        {patientName}
                    </h2>
                    <span className="patient-history-view__count">
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

            <div className="patient-history-view__table-wrapper">
                <table className="patient-history-view__table table-base">
                    <thead>
                        <tr>
                            <th className="patient-history-view__th">{translate('date')}</th>
                            <th className="patient-history-view__th">{translate('time') || 'Hora'}</th>
                            <th className="patient-history-view__th">{translate('doctor')}</th>
                            <th className="patient-history-view__th">{translate('reason') || 'Motivo'}</th>
                            <th className="patient-history-view__th patient-history-view__th--status">{translate('status')}</th>
                            <th className="patient-history-view__th patient-history-view__th--payment">{translate('payment')}</th>
                            <th className="patient-history-view__th patient-history-view__th--actions">{translate('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patientAppointments.map(appt => {
                            const apptDate = new Date(appt.appointment_date);
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
                            else if (effectiveTotal === 0) { paymentClass = ''; paymentLabel = '—'; }

                            return (
                                <tr
                                    key={appt.id}
                                    className={`patient-history-view__row patient-history-view__row--${appt.status}`}
                                    onClick={() => handlers.handleOpenAction(appt)}
                                    title={translate('view')}
                                >
                                    <td className="patient-history-view__td">
                                        {formatDate(appt.appointment_date)}
                                    </td>
                                    <td className="patient-history-view__td patient-history-view__td--time">
                                        {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </td>
                                    <td className="patient-history-view__td patient-history-view__td--doctor">
                                        {appt.doctor_name ? `Dr. ${appt.doctor_name.split(' ').pop()}` : '—'}
                                    </td>
                                    <td className="patient-history-view__td patient-history-view__td--reason">
                                        <span title={appt.reason}>{appt.reason || '—'}</span>
                                        {appt.type === 'virtual' && (
                                            <Icon name="videocam" size="0.9rem" className="patient-history-view__virtual-icon" title="Virtual" />
                                        )}
                                    </td>
                                    <td className="patient-history-view__td">
                                        <span className={`patient-history-view__status-chip patient-history-view__status-chip--${appt.status}`}>
                                            {translate(appt.status) || appt.status}
                                        </span>
                                    </td>
                                    <td className="patient-history-view__td">
                                        {paymentLabel !== '—' ? (
                                            <span className={`patient-history-view__payment-badge patient-history-view__payment-badge--${paymentClass}`}>
                                                {paymentLabel}
                                            </span>
                                        ) : <span className="patient-history-view__td--muted">—</span>}
                                    </td>
                                    <td className="patient-history-view__td patient-history-view__td--actions" onClick={e => e.stopPropagation()}>
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

export default PatientHistoryView;
