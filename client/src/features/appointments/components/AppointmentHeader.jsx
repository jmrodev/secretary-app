import React from 'react';
import Badge from '@/components/atoms/Badge';
import { useModal } from '@/context/ModalContext';
import { formatDate } from '@/utils/format';
import './AppointmentHeader.css';

/**
 * AppointmentHeader Molecule (Internal to feature).
 * Displays patient info and quick actions for an appointment.
 */
const AppointmentHeader = ({ appt, t }) => {
    const { alert } = useModal();

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

    const baseClass = 'appointment-header';

    return (
        <header className={baseClass}>
            <section className={`${baseClass}__patient-info`}>
                <h2 className="visually-hidden">{t('patient_info')}</h2>
                <p className={`${baseClass}__text`}>
                    <strong className={`${baseClass}__strong`}>{t('patient_label')}:</strong> {appt.patient_name || appt.reason || t('sync_required')}
                </p>
                <p className={`${baseClass}__date`}>
                    <strong className={`${baseClass}__strong`}>{t('date_label')}:</strong> {formatDate(appt.appointment_date, true)}
                </p>
            </section>

            <aside className={`${baseClass}__badges`}>
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
