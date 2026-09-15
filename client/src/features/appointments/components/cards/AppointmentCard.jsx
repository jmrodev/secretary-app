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
            <div className={`${styles.AppointmentCard__root} ${styles.AppointmentCard__skeleton}`} aria-busy="true">
                <div className={`${styles.AppointmentCard__info}`}>
                    <div className={`${styles.AppointmentCard__patientName}`}>{t('loading')}</div>
                    <div className={`${styles.AppointmentCard__details}`}>
                        <span className={`${styles.timeLine}`}>--:--</span>
                        <span className={`${styles.AppointmentCard__doctor}`}>{t('loading')}</span>
                    </div>
                </div>
                <div className={`${styles.AppointmentCard__status}`}>
                    <div className={`${styles.AppointmentCard__statusChip}`}>…</div>
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
                            const parts = (appt.patient_name || 'S/N').split(' ').filter(Boolean);
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
                            title={`${t('attended_appointments')}: ${appt.attended_appointments}`}
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
                        <span className={styles.rescheduledInfo} title={`${t('rescheduled')}: ${rescheduledFull}`}>
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
                            <div className={`${styles.AppointmentCard__paymentBadge} ${styles.AppointmentCard__paymentBadgeBonified}`} title={t('bonified')}>
                                <Icon name="verified" size="0.85rem" className={styles.AppointmentCard__paymentBadgeIcon} />
                                <span className={styles.AppointmentCard__paymentBadgeLabel}>{t('bonified')}</span>
                            </div>
                        );
                    }

                    if (effectiveTotal === 0 && !isAttended) return null;

                    let colorModifier = '';
                    let amountToDisplay = effectiveTotal;
                    let statusIconName = null;
                    let titleTooltip = '';
                    let statusLabel = '';

                    if (paid >= effectiveTotal && effectiveTotal > 0) {
                        colorModifier = 'Paid';
                        amountToDisplay = paid;
                        statusIconName = 'check_circle';
                        titleTooltip = `${t('paid')}: ${formatCurrency(paid)}`;
                        statusLabel = t('paid');
                    } else if (paid > 0 && paid < effectiveTotal) {
                        // Pago Parcial: Mostrar el saldo restante en rojo adeudado
                        colorModifier = 'Debt';
                        const remaining = effectiveTotal - paid;
                        amountToDisplay = remaining;
                        statusIconName = 'error';
                        titleTooltip = `${t('partial')}: ${formatCurrency(paid)} / ${formatCurrency(effectiveTotal)}`;
                        statusLabel = t('partial') || 'Resto';
                    } else if (!isAttended) {
                        colorModifier = 'Pending';
                        statusIconName = 'payments';
                        titleTooltip = `${t('pending')}: ${formatCurrency(effectiveTotal)}`;
                        statusLabel = t('pending');
                    } else if (pending > 0 || (!hasTransactions && cost > 0)) {
                        colorModifier = 'Debt';
                        amountToDisplay = pending > 0 ? pending : cost;
                        statusIconName = 'error';
                        titleTooltip = `${t('debt')}: ${formatCurrency(amountToDisplay)}`;
                        statusLabel = t('debt');
                    }

                    if (amountToDisplay === 0 && appt.payment_status !== 'paid') return null;

                    const badgeModifierClass = styles[`AppointmentCard__paymentBadge${colorModifier}`] || '';

                    return (
                        <div 
                            className={`${styles.AppointmentCard__paymentBadge} ${badgeModifierClass}`}
                            title={titleTooltip}
                        >
                            {statusIconName && (
                                <Icon name={statusIconName} size="0.85rem" className={styles.AppointmentCard__paymentBadgeIcon} />
                            )}
                            {statusLabel && (
                                <span className={styles.AppointmentCard__paymentBadgeLabel}>
                                    {statusLabel}
                                </span>
                            )}
                            <span className={styles.AppointmentCard__paymentBadgeAmount}>
                                {formatCurrency(amountToDisplay)}
                            </span>
                        </div>
                    );
                })()}
            </div>

            <div className={`${styles.AppointmentCard__status}`}>
                {(() => {
                    const statusKey = (appt.status || '').toLowerCase();
                    let statusIconName = null;
                    if (statusKey === 'completed' || statusKey === 'attended') statusIconName = 'check_circle';
                    else if (statusKey === 'confirmed') statusIconName = 'verified';
                    else if (statusKey === 'pending') statusIconName = 'schedule';
                    else if (statusKey === 'cancelled' || statusKey === 'suspended') statusIconName = 'cancel';
                    else if (statusKey === 'absent') statusIconName = 'person_off';
                    else if (statusKey === 'rescheduled') statusIconName = 'history';
                    else if (statusKey === 'arrived') statusIconName = 'how_to_reg';
                    else if (statusKey === 'virtual') statusIconName = 'videocam';

                    const chipClass = styles['AppointmentCard__statusChip' + (appt.status.charAt(0).toUpperCase() + appt.status.slice(1))] || styles.AppointmentCard__statusChip;

                    return (
                        <span className={`${styles.AppointmentCard__statusChip} ${chipClass}`}>
                            {statusIconName && <Icon name={statusIconName} size="0.85rem" className={styles.AppointmentCard__statusIcon} />}
                            <span>{t(appt.status) || appt.status}</span>
                        </span>
                    );
                })()}
            </div>
        </div>
    );
};

