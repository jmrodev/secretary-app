import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import { formatDate, formatTime, formatDateTimeLong } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import styles from './AppointmentCard.module.css';

/**
 * AppointmentCard Molecule (Internal to feature).
 * Compact representation of an appointment for lists and timelines.
 */
const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction, isLoading = false }) => {
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
            <div className={`${styles.root} ${styles.skeleton}`}>
                <div className={`${styles.info}`}>
                    <div className={`${styles.patientName}`}>Loading…</div>
                    <div className={`${styles.details}`}>
                        <span className={`${styles.timeLine}`}>00:00</span>
                        <span className={`${styles.doctor}`}>Loading details…</span>
                    </div>
                </div>
                <div className={`${styles.status}`}>
                    <div className={`${styles.statusChip}`}>…</div>
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
        styles.root,
        appt.status && styles[appt.status.toLowerCase()],
        appt.type === 'virtual' && styles.virtual,
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
            <div className={`${styles.timeLineTop}`}>
                {clientTime}
            </div>
            <div className={`${styles.info}`}>
                <div className={`${styles.patientName}`}>
                    {appt.type === 'virtual' && <Icon name="videocam" size="1.1rem" />}
                    <div className={`${styles.patientNameText}`}>
                        {(appt.patient_name || 'S/N').split(' ').map((part, index) => (
                            <span key={index} className={index === 0 ? styles.surname : styles.givenName}>
                                {part}
                            </span>
                        ))}
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
                
                <div className={`${styles.details}`}>
                    <span className={`${styles.doctor}`}>
                        {appt.doctor_name}
                    </span>
                    {(appt.reason_for_visit || appt.notes) && (
                        <span className={`${styles.reason}`}>
                            <Icon name="event_note" size="1rem" />
                            <span className={`${styles.reasonText}`}>
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

            <div className={`${styles.status}`}>
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
                            <div className={`${styles.paymentInfo} ${styles.paymentInfoBonified}`}>
                                <span>{t('bonified') || 'Bonif.'}</span>
                                <Icon name="verified" className={styles.paymentIcon} />
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
                        statusIcon = <Icon name="check_circle" className={styles.paymentIcon} />;
                    } else if (!isAttended) {
                        colorModifier = 'pending';
                    } else if (pending > 0 || (!hasTransactions && cost > 0)) {
                        colorModifier = 'debt';
                        amountToDisplay = pending > 0 ? pending : cost;
                        statusIcon = <Icon name="error" className={styles.paymentIcon} />;
                    }

                    if (amountToDisplay === 0) return null;

                    return (
                        <div className={`${styles.paymentInfo} ${styles['paymentInfo' + colorModifier.charAt(0).toUpperCase() + colorModifier.slice(1)]}`}>
                            <span>{formatCurrency(amountToDisplay)}</span>
                            {statusIcon}
                        </div>
                    );
                })()}

                <span className={`${styles.statusChip} ${styles['statusChip' + appt.status.charAt(0).toUpperCase() + appt.status.slice(1)]}`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>
        </div>
    );
};

export default AppointmentCard;
