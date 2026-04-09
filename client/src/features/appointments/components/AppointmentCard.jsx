import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './AppointmentCard.css';

/**
 * AppointmentCard Molecule (Internal to feature).
 * Compact representation of an appointment for lists and timelines.
 */
const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction }) => {
    const { t } = useLanguage();

    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';
    const isAnonymous = !appt.patient_id;

    return (
        <div
            className={`appointment-card appointment-card--${appt.status} ${appt.type === 'virtual' ? 'appointment-card--virtual' : ''} ${isExternal ? 'appointment-card--external' : ''} ${isAnonymous ? 'appointment-card--anonymous' : ''}`}
            onClick={onClick}
        >
            <div className="appointment-card__time-box">
                <span className="appointment-card__time">
                    {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
            </div>

            <div className="appointment-card__info">
                <div className="appointment-card__patient-name">
                    {appt.type === 'virtual' && <Icon name="videocam" size="1.1rem" className="mr-1" />}
                    {appt.patient_name || 'S/N'}
                </div>
                {appt.patient_phone && (
                    <Button
                        to={`tel:${String(appt.patient_phone).replace(/[^0-9+]/g, '')}`}
                        variant="phone" size="sm" className="appointment-card__phone"
                        onClick={(e) => e.stopPropagation()}
                        icon={<Icon name="call" size="0.9rem" />}
                    >
                        {appt.patient_phone}
                    </Button>
                )}
                <div className="appointment-card__details">
                    <span className="appointment-card__doctor">
                        <Icon name="person" size="1rem" className="mr-1" />
                        {appt.doctor_name}
                    </span>
                    {appt.reason && <span className="appointment-card__reason">• {appt.reason}</span>}
                </div>
            </div>

            <div className="appointment-card__status">
                {(() => {
                    const isAttended = ['arrived', 'attended', 'completed'].includes(appt.status);
                    const paid = Number(appt.paid_amount || 0);
                    const pending = Number(appt.pending_amount || 0);
                    const txTotal = paid + pending;
                    const cost = Number(appt.cost || 0);
                    const instBasePrice = Number(appt.institution_base_price || 0);
                    const hasTransactions = txTotal > 0;
                    const fallbackCost = cost > 0 ? cost : instBasePrice;
                    const effectiveTotal = hasTransactions ? txTotal : fallbackCost;

                    if (appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') {
                        return (
                            <div className="appt-status__col">
                                <div className="appt-status__text appt-status__amount--paid">
                                    <span style={{ color: 'var(--blue-600)', textTransform: 'uppercase', fontSize: '10px' }}>{t('bonified') || 'Bonificado'}</span>
                                    <Icon name="verified" size="1rem" style={{ color: 'var(--blue-500)' }} />
                                </div>
                            </div>
                        );
                    }

                    if (effectiveTotal === 0 && !isAttended) return null;

                    let colorModifier = '';
                    let amountToDisplay = effectiveTotal;
                    let statusIcon = null;

                    if (paid >= effectiveTotal && effectiveTotal > 0) {
                        colorModifier = 'paid';
                        amountToDisplay = paid;
                        statusIcon = <Icon name="check_circle" size="1rem" className="appt-status__check" />;
                    } else if (!isAttended) {
                        colorModifier = 'pending';
                    } else if (pending > 0 || (!hasTransactions && cost > 0)) {
                        colorModifier = 'debt';
                        amountToDisplay = pending > 0 ? pending : cost;
                        statusIcon = <Icon name="cancel" size="1rem" className="appt-status__check" />;
                    }

                    if (amountToDisplay === 0) return null;

                    return (
                        <div className="appt-status__col">
                            <div className={`appt-status__text appt-status__amount--${colorModifier}`}>
                                <span>${amountToDisplay.toLocaleString()}</span>
                                {statusIcon}
                            </div>
                        </div>
                    );
                })()}

                <span className={`appointment-card__status-chip appointment-card__status-chip--${appt.status}`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>

            {showActions && appt.status !== 'completed' && (
                <div className="appointment-card__actions">
                    <Button
                        variant="ghost" size="sm-compact"
                        onClick={(e) => { e.stopPropagation(); onWhatsAppAction(appt, 'reminder'); }}
                        className="appointment-card__action-btn" icon={<Icon name="send" />}
                    />
                    <Button
                        variant="ghost" size="sm-compact"
                        onClick={(e) => { e.stopPropagation(); onWhatsAppAction(appt, 'confirmation'); }}
                        className="appointment-card__action-btn" icon={<Icon name="auto_awesome" />}
                    />
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
