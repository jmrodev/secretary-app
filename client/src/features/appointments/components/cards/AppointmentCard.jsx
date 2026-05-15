import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import { formatDate, formatTime, formatDateTimeLong } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import './AppointmentCard.css';

/**
 * AppointmentCard Molecule (Internal to feature).
 * Compact representation of an appointment for lists and timelines.
 */
const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction }) => {
    const { t } = useLanguage();
    const [clientTime, setClientTime] = React.useState('');

    React.useEffect(() => {
        if (appt.appointment_date) {
            setClientTime(formatTime(appt.appointment_date, { hour12: false }));
        }
    }, [appt.appointment_date]);

    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';
    const isAnonymous = !appt.patient_id;

    const [rescheduledDate, setRescheduledDate] = React.useState('');
    const [rescheduledFull, setRescheduledFull] = React.useState('');

    React.useEffect(() => {
        if (appt.rescheduled_from_date) {
            setRescheduledDate(formatDate(appt.rescheduled_from_date));
            setRescheduledFull(formatDateTimeLong(appt.rescheduled_from_date));
        }
    }, [appt.rescheduled_from_date]);

    const handleKeyDown = (e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(e);
        }
    };

    return (
        <div
            className={`appointment-card appointment-card--${appt.status} ${appt.type === 'virtual' ? 'appointment-card--virtual' : ''} ${isExternal ? 'appointment-card--external' : ''} ${isAnonymous ? 'appointment-card--anonymous' : ''}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className="appointment-card__time-box">
                <span className="appointment-card__time">
                    {clientTime}
                </span>
            </div>

            <div className="appointment-card__info">
                <div className="appointment-card__patient-name">
                    {appt.type === 'virtual' && <Icon name="videocam" size="1.1rem" />}
                    <span className="appointment-card__patient-name-text">
                        {appt.patient_name || 'S/N'}
                    </span>
                    {appt.attended_appointments > 0 && (
                        <Badge 
                            variant="success" 
                            className="appointment-card__visit-count" 
                            title={`${t('attended_appointments') || 'Visitas'}: ${appt.attended_appointments}`}
                        >
                            <Icon name="history" size="0.9rem" /> {appt.attended_appointments}
                        </Badge>
                    )}
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
                        <Icon name="person" size="1rem" />
                        {appt.doctor_name}
                    </span>
                    {appt.reason && <span className="appointment-card__reason">• {appt.reason}</span>}
                    {appt.rescheduled_from_date && (
                        <span className="appointment-card__rescheduled-info" title={`Reprogramado del ${rescheduledFull}`}>
                            <Icon name="history" size="0.9rem" />
                            {rescheduledDate}
                        </span>
                    )}
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
                            <div className="appointment-card__payment-info appointment-card__payment-info--bonified">
                                <span>{t('bonified') || 'Bonif.'}</span>
                                <Icon name="verified" className="appointment-card__payment-icon" />
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
                        statusIcon = <Icon name="check_circle" className="appointment-card__payment-icon" />;
                    } else if (!isAttended) {
                        colorModifier = 'pending';
                    } else if (pending > 0 || (!hasTransactions && cost > 0)) {
                        colorModifier = 'debt';
                        amountToDisplay = pending > 0 ? pending : cost;
                        statusIcon = <Icon name="error" className="appointment-card__payment-icon" />;
                    }

                    if (amountToDisplay === 0) return null;

                    return (
                        <div className={`appointment-card__payment-info appointment-card__payment-info--${colorModifier}`}>
                            <span>{formatCurrency(amountToDisplay)}</span>
                            {statusIcon}
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
