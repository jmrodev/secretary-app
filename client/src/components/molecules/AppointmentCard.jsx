import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './AppointmentCard.css';

const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction }) => {
    const { t } = useLanguage();

    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';
    const isAnonymous = !appt.patient_id;

    return (
        <div
            className={`appointment-card appointment-card--${appt.status} ${appt.type === 'virtual' ? 'appointment-card--virtual' : ''} ${isExternal ? 'appointment-card--external' : ''} ${isAnonymous ? 'appointment-card--anonymous' : ''}`}
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
                    {appt.type === 'virtual' && <Icon name="videocam" size="1.1rem" className="mr-1" />}
                    {appt.patient_name || 'S/N'}
                </div>
                {appt.patient_phone && (
                    <Button
                        to={`tel:${appt.patient_phone.replace(/[^0-9+]/g, '')}`}
                        variant="phone"
                        size="sm"
                        className="appointment-card__phone"
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
                    let statusIcon = null;

                    if (!isAttended) {
                        colorModifier = 'pending';
                    } else {
                        if (paid >= effectiveTotal && effectiveTotal > 0) {
                            colorModifier = 'paid';
                            amountToDisplay = paid;
                            statusIcon = <Icon name="check_circle" size="1rem" className="appt-status__check" />;
                        } else if (pending > 0 || (!hasTransactions && cost > 0)) {
                            colorModifier = 'debt';
                            amountToDisplay = pending > 0 ? pending : cost;
                            statusIcon = <Icon name="cancel" size="1rem" className="appt-status__check" />;
                        }
                    }

                    if (amountToDisplay === 0) return null;

                    return (
                        <div className="appt-status__col">
                            <div className={`appt-status__text appt-status__amount--${colorModifier}`}>
                                <span>${amountToDisplay.toLocaleString()}</span>
                                {statusIcon}
                            </div>
                            {appt.payment_methods && paid > 0 && (
                                <span className="appt-status__icon-group">
                                    {appt.payment_methods.split(',').map((m, idx) => {
                                        const method = m.trim();
                                        let iconName = 'payments';
                                        if (method === 'cash') iconName = 'payments';
                                        else if (method === 'transfer') iconName = 'account_balance';
                                        else iconName = 'credit_card';
                                        return <Icon key={idx} name={iconName} size="1rem" />;
                                    })}
                                </span>
                            )}
                        </div>
                    );
                })()}

                <span className={`appointment-card__status-chip appointment-card__status-chip--${appt.status} status-chip status-${appt.status}`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>

            {/* Col 4: Actions (Optional) */}
            {showActions && appt.status !== 'completed' && (
                <div className="appointment-card__actions">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={(e) => {
                            e.stopPropagation();
                            onWhatsAppAction(appt, 'reminder');
                        }}
                        className="appointment-card__action-btn"
                        title={t('whatsapp_reminder')}
                        icon={<Icon name="send" />}
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={(e) => {
                            e.stopPropagation();
                            onWhatsAppAction(appt, 'confirmation');
                        }}
                        className="appointment-card__action-btn"
                        title={t('whatsapp_proof')}
                        icon={<Icon name="auto_awesome" />}
                    />
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
