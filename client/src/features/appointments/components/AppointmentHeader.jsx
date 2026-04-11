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

    const baseClass = 'appointment-header';

    return (
        <div className={baseClass}>
            <div className={`${baseClass}__patient-info`}>
                <p className={`${baseClass}__text`}>
                    <strong className={`${baseClass}__strong`}>{t('patient_label')}:</strong> {appt.patient_name || appt.reason || t('sync_required')}
                </p>
                <p className={`${baseClass}__date`}>
                    <strong className={`${baseClass}__strong`}>{t('date_label')}:</strong> {formatDate(appt.appointment_date, true)}
                </p>
            </div>

            <div className={`${baseClass}__badges`}>
                <Badge variant={appt.status}>
                    {t(appt.status) || appt.status}
                </Badge>
                
                {/* Payment badge: only show if NOT bonified */}
                {!(appt.bonified === 1 || appt.bonified === true) ? (
                    <Badge variant={appt.payment_status === 'paid' ? 'green' : 'red'}>
                        {appt.payment_status === 'paid' ? t('paid') : t('debt')}
                    </Badge>
                ) : (
                    <Badge variant="accent">
                        {t('bonified')}
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default AppointmentHeader;
