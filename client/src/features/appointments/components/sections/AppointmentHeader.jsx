import React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/format';
import styles from './AppointmentHeader.module.css';

const getStatusVariant = (status) => {
    switch (status) {
        case 'completed':
        case 'attended': return 'success';
        case 'confirmed': return 'blue';
        case 'arrived': return 'accent';
        case 'rescheduled': return 'default';
        case 'suspended': return 'warning';
        case 'absent':
        case 'cancelled': return 'danger';
        case 'pending': return 'pending';
        case 'consult': return 'consult';
        default: return 'default';
    }
};

const getPaymentStatusVariant = (paymentStatus) => {
    switch (paymentStatus) {
        case 'paid': return 'success';
        case 'pending': return 'pending';
        case 'partial': return 'warning';
        case 'debt': return 'danger';
        default: return 'danger';
    }
};

/**
 * AppointmentHeader Molecule (Internal to feature).
 * Displays patient info and quick actions for an appointment.
 */
export const AppointmentHeader = ({ appt, t }) => {
    const getPaymentStatusLabel = (paymentStatus) => {
        switch (paymentStatus) {
            case 'paid': return t('paid') || 'Pagado';
            case 'pending': return t('pending') || 'Pendiente';
            case 'partial': return t('partial') || 'Parcial';
            case 'debt': return t('debt') || 'Deuda';
            default: return t(paymentStatus) || paymentStatus || 'Deuda';
        }
    };

    return (
        <header className={styles.AppointmentHeader__root}>
            <section className={styles.AppointmentHeader__patientInfo}>
                <h2 className={styles.AppointmentHeader__visuallyHidden}>{t('patient_info')}</h2>
                <h3 className={styles.AppointmentHeader__text}>
                    {appt.patient_name || appt.reason || t('sync_required')}
                </h3>
                <p className={styles.AppointmentHeader__date}>
                    <Icon name="calendar_month" size="1.1rem" />
                    {formatDate(appt.appointment_date, true)}
                </p>

                {/* Timeline / Traceability section - Colorful pills */}
                <div className={styles.AppointmentHeader__timelineList}>
                    {appt.created_at && (
                        <div className={`${styles.AppointmentHeader__timelineItem} ${styles.AppointmentHeader__itemCreated}`} title={t('appointment_creation_title') || "Creación del turno"}>
                            <Icon name="add_circle" size="0.85rem" />
                            <span>{t('created') || 'Creado'}: {formatDate(appt.created_at, true)}</span>
                        </div>
                    )}

                    {appt.confirmed_at && (
                        <div className={`${styles.AppointmentHeader__timelineItem} ${styles.AppointmentHeader__itemConfirmed}`} title={t('appointment_confirmation_title') || "Confirmación de la cita"}>
                            <Icon name="check_circle" size="0.85rem" />
                            <span>{t('confirmed') || 'Confirmado'}: {formatDate(appt.confirmed_at, true)}</span>
                        </div>
                    )}

                    {appt.arrived_at && (
                        <div className={`${styles.AppointmentHeader__timelineItem} ${styles.AppointmentHeader__itemArrived}`} title={t('appointment_arrived_title') || "Llegada a sala de espera"}>
                            <Icon name="meeting_room" size="0.85rem" />
                            <span>{t('in_waiting_room') || 'En sala'}: {formatDate(appt.arrived_at, true)}</span>
                        </div>
                    )}

                    {appt.completed_at && (
                        <div className={`${styles.AppointmentHeader__timelineItem} ${styles.AppointmentHeader__itemCompleted}`} title={t('appointment_completed_title') || "Atención finalizada"}>
                            <Icon name="task_alt" size="0.85rem" />
                            <span>{t('attended') || 'Atendido'}: {formatDate(appt.completed_at, true)}</span>
                        </div>
                    )}

                    {appt.paid_at && (
                        <div className={`${styles.AppointmentHeader__timelineItem} ${!(appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') ? styles.AppointmentHeader__itemPaid : styles.AppointmentHeader__itemBonified}`} title={!(appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') ? "Cobro registrado" : "Turno bonificado"}>
                            <Icon name={!(appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') ? "payments" : "card_giftcard"} size="0.85rem" />
                            <span>{!(appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') ? 'Pagado' : 'Bonificado'}: {formatDate(appt.paid_at, true)}</span>
                        </div>
                    )}
                </div>
            </section>

            <aside className={styles.AppointmentHeader__badges}>
                <Badge variant={getStatusVariant(appt.status)}>
                    {t('appointment_status') || 'Turno'}: {t(appt.status) || appt.status}
                </Badge>
                
                {/* Payment badge */}
                {!(appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') ? (
                    <Badge variant={getPaymentStatusVariant(appt.payment_status)}>
                        {t('payment') || 'Pago'}: {getPaymentStatusLabel(appt.payment_status)}
                    </Badge>
                ) : (
                    <Badge variant="accent">
                        {t('payment') || 'Pago'}: {t('bonified') || 'Bonificado'}
                    </Badge>
                )}
            </aside>
        </header>
    );
};

