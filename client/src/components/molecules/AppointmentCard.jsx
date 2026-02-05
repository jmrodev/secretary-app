import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './AppointmentCard.css';

const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction }) => {
    const { t } = useLanguage();

    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';
    const isAnonymous = !appt.patient_id;

    return (
        <div
            className={`appointment-card status-${appt.status} ${isExternal ? 'appointment-card--external' : ''} ${isAnonymous ? 'appointment-card--anonymous' : ''}`}
            onClick={onClick}
        >
            {/* Col 1: Time */}
            <div className="appointment-card__time-box">
                <span className="appointment-card__time">
                    {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
            </div>

            {/* Col 2: Info */}
            <div className="appointment-card__info">
                <div className="appointment-card__patient-name">
                    {appt.type === 'virtual' && '📹 '}
                    {appt.patient_name || 'S/N'}
                </div>
                {appt.patient_phone && (
                    <a
                        href={`tel:${appt.patient_phone.replace(/[^0-9+]/g, '')}`}
                        className="appointment-card__phone"
                        onClick={(e) => e.stopPropagation()}
                    >
                        📱 {appt.patient_phone}
                    </a>
                )}
                <div className="appointment-card__details">
                    <span className="appointment-card__doctor">👨‍⚕️ {appt.doctor_name}</span>
                    {appt.reason && <span className="appointment-card__reason">• {appt.reason}</span>}
                </div>
            </div>

            {/* Col 3: Status & Payment */}
            <div className="appointment-card__status">
                {(() => {
                    const isAttended = ['arrived', 'attended', 'completed'].includes(appt.status);
                    const paid = Number(appt.paid_amount || 0);
                    const pending = Number(appt.pending_amount || 0);
                    const txTotal = paid + pending;
                    const cost = Number(appt.cost || 0);
                    const hasTransactions = txTotal > 0;
                    const effectiveTotal = hasTransactions ? txTotal : cost;

                    if (effectiveTotal === 0 && !isAttended) return null;

                    let colorModifier = '';
                    let amountToDisplay = effectiveTotal;
                    let icon = '';

                    if (!isAttended) {
                        colorModifier = 'pending';
                        amountToDisplay = hasTransactions ? txTotal : cost;
                    } else {
                        if (paid >= effectiveTotal && effectiveTotal > 0) {
                            colorModifier = 'paid';
                            amountToDisplay = paid;
                            icon = ' ✓';
                        } else if (pending > 0) {
                            colorModifier = 'debt';
                            amountToDisplay = pending;
                            icon = ' ✘';
                        } else if (!hasTransactions && cost > 0) {
                            colorModifier = 'debt';
                            amountToDisplay = cost;
                            icon = ' ✘';
                        }
                    }

                    if (amountToDisplay === 0) return null;

                    return (
                        <div className="appt-status__col">
                            <div className={`appt-status__text appt-status__amount--${colorModifier}`}>
                                <span>${amountToDisplay.toLocaleString()}</span>
                                {icon && <span className="appt-status__check">{icon}</span>}
                            </div>
                            {appt.payment_methods && paid > 0 && (
                                <span className="appt-status__icon-group">
                                    {appt.payment_methods.split(',').map(m =>
                                        m.trim() === 'cash' ? '💵' :
                                            m.trim() === 'transfer' ? '🏦' : '💳'
                                    ).join('')}
                                </span>
                            )}
                        </div>
                    );
                })()}

                <span className={`appointment-card__status-chip status-${appt.status}`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>

            {/* Col 4: Actions (Optional) */}
            {showActions && (
                <div className="appointment-card__actions">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onWhatsAppAction(appt, 'reminder');
                    }}
                        className="appointment-card__action-btn appointment-card__action-btn--whatsapp"
                        title="Enviar recordatorio"
                    >
                        📲
                    </button>
                    <button onClick={(e) => {
                        e.stopPropagation();
                        onWhatsAppAction(appt, 'confirmation');
                    }}
                        className="appointment-card__action-btn appointment-card__action-btn--receipt"
                        title="Enviar comprobante"
                    >
                        ✨
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
