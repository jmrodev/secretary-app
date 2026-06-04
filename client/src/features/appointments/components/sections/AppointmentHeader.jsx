import React from 'react';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/format';
import styles from './AppointmentHeader.module.css';

/**
 * AppointmentHeader Molecule (Internal to feature).
 * Displays patient info and quick actions for an appointment.
 */
const AppointmentHeader = ({ appt, t }) => {
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

    const baseClass = styles.root;

    return (
        <header className={styles.root}>
            <section className={styles.patientInfo}>
                <h2 className={styles.visuallyHidden}>{t('patient_info')}</h2>
                <h3 className={styles.text}>
                    {appt.patient_name || appt.reason || t('sync_required')}
                </h3>
                <p className={styles.date}>
                    <Icon name="calendar_month" size="1.1rem" />
                    {formatDate(appt.appointment_date, true)}
                </p>
            </section>

            <aside className={styles.badges}>
                <Badge variant={getStatusVariant(appt.status)}>
                    {t(appt.status) || appt.status}
                </Badge>
                
                {/* Payment badge: only show if NOT bonified */}
                {!(appt.bonified === 1 || appt.bonified === true) ? (
                    <Badge variant={appt.payment_status === 'paid' ? 'success' : 'danger'}>
                        {appt.payment_status === 'paid' ? t('paid') : t('debt')}
                    </Badge>
                ) : (
                    <Badge variant="accent">
                        {t('bonified')}
                    </Badge>
                )}
            </aside>
        </header>
    );
};

export default AppointmentHeader;
