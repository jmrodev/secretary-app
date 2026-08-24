import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { formatDate, formatTime, formatDateTimeLong } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import styles from './AppointmentCard.module.css';

/**
 * AppointmentCard Molecule (Internal to feature).
 * Compact representation of an appointment for lists and timelines.
 */
export const AppointmentCard = ({ appt, onClick, showActions: _showActions = false, onWhatsAppAction: _onWhatsAppAction, isLoading = false }) => {
    const { t } = useLanguage();
    
    // --- Derived State during render (No Effects needed) ---
    const clientTime = (!isLoading && appt?.appointment_date) 
        ? formatTime(appt.appointment_date, { hour12: false }) 
        : '';
        
    const rescheduledDate = (!isLoading && appt?.rescheduled_from_date) 
        ? formatDate(appt.rescheduled_from_date) 
        : '';
        
    const rescheduledFull = (!isLoading && appt?.rescheduled_from_date) 
        ? formatDateTimeLong(appt.rescheduled_from_date) 
        : '';

    // --- Conditional Render AFTER Hooks ---
    if (isLoading) {
        return (
            <div className={`${styles.AppointmentCard__root} ${styles.AppointmentCard__skeleton}`}>
                <div className={`${styles.AppointmentCard__info}`}>
                    <div className={`${styles.AppointmentCard__patientName}`}>{t('loading') || 'Loading…'}</div>
                    <div className={`${styles.AppointmentCard__details}`}>
                        <span className={`${styles.timeLine}`}>{t('placeholder_time') || '00:00'}</span>
                        <span className={`${styles.AppointmentCard__doctor}`}>{t('loading_details') || 'Loading details…'}</span>
                    </div>
                </div>
                <div className={`${styles.AppointmentCard__status}`}>
                    <div className={`${styles.AppointmentCard__statusChip}`}>{t('loading_status') || '…'}</div>
                </div>
            </div>
        );
    }

    // --- Standard Logic ---
    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';
    const isAnonymous = !appt.patient_id;

    const handleKeyDown = (e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick(e);
        }
    };

    const cardClasses = [
        styles.AppointmentCard__root,
        appt.status && styles[appt.status.toLowerCase()],
        appt.type === 'virtual' && styles.AppointmentCard__virtual,
        isExternal && styles.external,
        isAnonymous && styles.anonymous
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cardClasses}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className={`${styles.AppointmentCard__timeLineTop}`}>
                {clientTime}
            </div>
            <div className={`${styles.AppointmentCard__info}`}>
                <div className={`${styles.AppointmentCard__patientName}`}>
                    {appt.type === 'virtual' && <Icon name="videocam" size="1.1rem" />}
                    <div className={`${styles.AppointmentCard__patientNameText}`}>
                        {(() => {
                            const nameString = appt.patient_name || (appt.reason ? `${t('no_patient') || 'Sin Paciente'} (${appt.reason})` : (t('unknown') || 'Desconocido'));
                            const parts = nameString.split(' ').filter(Boolean);
                            if (parts.length === 1) {
                                return <span className={styles.AppointmentCard__surname}>{parts[0]}</span>;
                            }
                            const surnameIndex = parts.length - 1;
                return parts.map((part, index) => (
                                    <span key={part} className={index === surnameIndex ? styles.AppointmentCard__surname : styles.AppointmentCard__givenName}>
                                        {part}
                                    </span>
                                ));
                        })()}
                    </div>
                    {appt.attended_appointments > 0 && (
                        <Badge 
                            variant="success" 
                            className={styles.visitCount} 
                            title={`${t('attended_appointments') || 'Visitas'}: ${appt.attended_appointments}`}
                        >
                            <Icon name="history" size="0.9rem" /> {appt.attended_appointments}
                        </Badge>
                    )}
                </div>
                
                <div className={`${styles.AppointmentCard__details}`}>
                    <span className={`${styles.AppointmentCard__doctor}`}>
                        {appt.doctor_name}
                    </span>
                    {(appt.reason_for_visit || appt.notes) && (
                        <span className={`${styles.AppointmentCard__reason}`}>
                            <Icon name="event_note" size="1rem" />
                            <span className={`${styles.AppointmentCard__reasonText}`}>
                                {appt.reason_for_visit || appt.notes}
                            </span>
                        </span>
                    )}
                    {appt.rescheduled_from_date && (
                        <span className={styles.rescheduledInfo} title={`Reprogramado del ${rescheduledFull}`}>
                            <Icon name="history" size="0.9rem" />
                            {rescheduledDate}
                        </span>
                    )}
                </div>
            </div>

            <div className={`${styles.AppointmentCard__paymentColumn}`}>
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
                            <div className={`${styles.AppointmentCard__paymentInfo} ${styles.AppointmentCard__paymentInfoBonified}`}>
                                <span>{t('bonified') || 'Bonif.'}</span>
                                <Icon name="verified" className={styles.paymentIcon} />
                            </div>
                        );
                    }

                    if (effectiveTotal === 0 && !isAttended) return null;

                    let colorModifier = '';
                    let amountToDisplay = effectiveTotal;
                    let statusIcon = null;
                    let titleTooltip = '';

                    if (paid >= effectiveTotal && effectiveTotal > 0) {
                        colorModifier = 'paid';
                        amountToDisplay = paid;
                        statusIcon = <Icon name="check_circle" className={styles.paymentIcon} />;
                        titleTooltip = `${t('fully_paid') || 'Pagado totalmente'}: $${paid}`;
                    } else if (paid > 0 && paid < effectiveTotal) {
                        // Pago Parcial: Mostrar el saldo restante en rojo adeudado
                        colorModifier = 'debt';
                        const remaining = effectiveTotal - paid;
                        amountToDisplay = remaining;
                        statusIcon = <Icon name="error" className={styles.paymentIcon} />;
                        titleTooltip = `${t('partial_payment') || 'Pago parcial'}: ${t('collected') || 'Cobrado'} $${paid} ${t('of') || 'de'} $${effectiveTotal}. ${t('balance_due') || 'Saldo adeudado'}: $${remaining}`;
                    } else if (!isAttended) {
                        colorModifier = 'pending';
                        statusIcon = <Icon name="payments" className={styles.paymentIcon} />;
                        titleTooltip = `${t('pending_payment') || 'Pendiente de cobro'}: $${effectiveTotal}`;
                    } else if (pending > 0 || (!hasTransactions && cost > 0)) {
                        colorModifier = 'debt';
                        amountToDisplay = pending > 0 ? pending : cost;
                        statusIcon = <Icon name="error" className={styles.paymentIcon} />;
                        titleTooltip = `${t('pending_debt') || 'Deuda pendiente'}: $${amountToDisplay}`;
                    }

                    if (amountToDisplay === 0 && appt.payment_status !== 'paid') return null;

                    return (
                        <div 
                            className={`${styles.AppointmentCard__paymentInfo} ${styles['paymentInfo' + colorModifier.charAt(0).toUpperCase() + colorModifier.slice(1)]}`}
                            title={titleTooltip}
                        >
                            {paid > 0 && paid < effectiveTotal && (
                                <span className={styles.AppointmentCard__paymentResto}>
                                    ({t('resto') || 'Resto'})
                                </span>
                            )}
                            <span>{formatCurrency(amountToDisplay)}</span>
                            {statusIcon}
                        </div>
                    );
                })()}
            </div>

            <div className={`${styles.AppointmentCard__status}`}>
                <span className={`${styles.AppointmentCard__statusChip} ${styles['statusChip' + appt.status.charAt(0).toUpperCase() + appt.status.slice(1)]}`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>
        </div>
    );
};

