import React from 'react';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { isPast, compareDates, formatDate, formatTime } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import './UpcomingAppointmentsView.css';

/**
 * UpcomingAppointmentsView (Executor Component).
 * Renders a highly responsive and premium table representation of upcoming appointments.
 */
const UpcomingAppointmentsView = ({ appointments, loading, t, onAction, onWhatsApp }) => {
    if (loading) return <Loading />;

    const upcoming = (appointments || [])
        .filter(a => !isPast(a.appointment_date))
        .sort((a, b) => compareDates(a.appointment_date, b.appointment_date));

    if (upcoming.length === 0) {
        return (
            <div className="upcoming-appointments-view__empty">
                <Icon name="event_busy" size="4rem" className="upcoming-appointments-view__empty-icon" />
                <h3 className="upcoming-appointments-view__empty-title">{t('no_upcoming_appointments')}</h3>
                <p className="upcoming-appointments-view__empty-hint">{t('no_upcoming_hint')}</p>
            </div>
        );
    }

    return (
        <div className="upcoming-appointments-view animate-fade-in">
            <div className="upcoming-appointments-view__header">
                <div className="upcoming-appointments-view__title-group">
                    <div className="upcoming-appointments-view__icon-wrapper">
                        <Icon name="upcoming" size="1.4rem" className="upcoming-appointments-view__icon" />
                    </div>
                    <div>
                        <h2 className="upcoming-appointments-view__title">{t('next_appointments') || 'Próximos Turnos'}</h2>
                        <p className="upcoming-appointments-view__subtitle">{t('upcoming_total_count', { count: upcoming.length }) || `${upcoming.length} turnos programados a futuro`}</p>
                    </div>
                </div>
            </div>

            <div className="upcoming-appointments-view__table-container">
                <table className="upcoming-appointments-view__table">
                    <thead>
                        <tr>
                            <th>{t('date_time') || 'Fecha y Hora'}</th>
                            <th>{t('patient') || 'Paciente'}</th>
                            <th>{t('doctor') || 'Profesional'}</th>
                            <th>{t('service') || 'Prestación'}</th>
                            <th>{t('payment') || 'Pago / Tarifas'}</th>
                            <th>{t('status') || 'Estado'}</th>
                            <th className="upcoming-appointments-view__actions-col">{t('actions') || 'Acciones'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {upcoming.map((appt) => {
                            const dateStr = formatDate(appt.appointment_date, { weekday: true, monthName: true });
                            const timeStr = formatTime(appt.appointment_date, { hour12: false });
                            const isVirtual = appt.type === 'virtual';
                            
                            // Cost Calculation
                            const paid = Number(appt.paid_amount || 0);
                            const pending = Number(appt.pending_amount || 0);
                            const txTotal = paid + pending;
                            const cost = Number(appt.cost || 0);
                            const instBasePrice = Number(appt.institution_base_price || 0);
                            const hasTransactions = txTotal > 0;
                            const fallbackCost = cost > 0 ? cost : instBasePrice;
                            const effectiveTotal = hasTransactions ? txTotal : fallbackCost;

                            let paymentText;
                            let paymentStatusClass;

                            if (appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') {
                                paymentText = t('bonified') || 'Bonificado';
                                paymentStatusClass = 'bonified';
                            } else if (effectiveTotal === 0) {
                                paymentText = t('free') || 'Sin Cargo';
                                paymentStatusClass = 'free';
                            } else if (paid >= effectiveTotal) {
                                paymentText = formatCurrency(paid);
                                paymentStatusClass = 'paid';
                            } else {
                                paymentText = formatCurrency(effectiveTotal);
                                paymentStatusClass = pending > 0 ? 'debt' : 'pending';
                            }

                            return (
                                <tr key={appt.id} className={`upcoming-appointments-view__row upcoming-appointments-view__row--${appt.status}`}>
                                    {/* Date & Time */}
                                    <td className="upcoming-appointments-view__cell-date">
                                        <div className="upcoming-appointments-view__date-info">
                                            <span className="upcoming-appointments-view__time-label">
                                                <Icon name="schedule" size="0.95rem" />
                                                {timeStr}
                                            </span>
                                            <span className="upcoming-appointments-view__date-label">{dateStr}</span>
                                        </div>
                                    </td>

                                    {/* Patient */}
                                    <td>
                                        <div className="upcoming-appointments-view__patient-info">
                                            <span className="upcoming-appointments-view__patient-name">{appt.patient_name || 'S/N'}</span>
                                            <span className="upcoming-appointments-view__patient-subtext">
                                                {appt.patient_dni && <span>DNI {appt.patient_dni}</span>}
                                                {appt.patient_phone && (
                                                    <span className="upcoming-appointments-view__patient-phone">
                                                        • {appt.patient_phone}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Doctor */}
                                    <td>
                                        <div className="upcoming-appointments-view__doctor-info">
                                            <span className="upcoming-appointments-view__doctor-name">{appt.doctor_name}</span>
                                            {appt.insurance_name && (
                                                <span className="upcoming-appointments-view__doctor-subtext">
                                                    <Icon name="badge" size="0.85rem" />
                                                    {appt.insurance_name}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Service / Reason */}
                                    <td>
                                        <div className="upcoming-appointments-view__service-info">
                                            <span className="upcoming-appointments-view__service-type">
                                                {isVirtual ? (
                                                    <span className="upcoming-appointments-view__type-badge upcoming-appointments-view__type-badge--virtual">
                                                        <Icon name="videocam" size="0.9rem" />
                                                        {t('virtual') || 'Virtual'}
                                                    </span>
                                                ) : (
                                                    <span className="upcoming-appointments-view__type-badge upcoming-appointments-view__type-badge--presential">
                                                        <Icon name="person" size="0.9rem" />
                                                        {t('presential') || 'Presencial'}
                                                    </span>
                                                )}
                                            </span>
                                            {appt.reason && <span className="upcoming-appointments-view__reason">{appt.reason}</span>}
                                        </div>
                                    </td>

                                    {/* Pricing & Billing */}
                                    <td>
                                        <div className="upcoming-appointments-view__payment-info">
                                            <span className={`upcoming-appointments-view__payment-badge upcoming-appointments-view__payment-badge--${paymentStatusClass}`}>
                                                {paymentStatusClass === 'paid' && <Icon name="check_circle" size="0.9rem" />}
                                                {paymentStatusClass === 'debt' && <Icon name="error" size="0.9rem" />}
                                                {paymentText}
                                            </span>
                                            {pending > 0 && paid > 0 && (
                                                <span className="upcoming-appointments-view__payment-subtext">
                                                    {t('paid')}: {formatCurrency(paid)}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Status Badge */}
                                    <td>
                                        <span className={`upcoming-appointments-view__status-badge upcoming-appointments-view__status-badge--${appt.status}`}>
                                            {t(appt.status) || appt.status}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="upcoming-appointments-view__cell-actions">
                                        <div className="upcoming-appointments-view__actions-wrapper">
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onAction(appt)}
                                                title={t('view_details') || 'Gestionar Turno'}
                                                icon={<Icon name="edit" size="1.05rem" />}
                                                className="upcoming-appointments-view__action-btn"
                                            />
                                            {appt.patient_phone && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => onWhatsApp(appt)}
                                                    title={t('send_whatsapp') || 'Enviar WhatsApp'}
                                                    icon={<Icon name="chat" size="1.05rem" />}
                                                    className="upcoming-appointments-view__action-btn upcoming-appointments-view__action-btn--whatsapp"
                                                />
                                            )}
                                        </div>
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

export default UpcomingAppointmentsView;
