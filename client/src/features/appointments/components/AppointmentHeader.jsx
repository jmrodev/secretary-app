import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { useMessage } from '@/context/MessageContext';
import { useModal } from '@/context/ModalContext';
import { formatDate } from '@/utils/format';
import { printInvoice } from '@/utils/printInvoice';
import './AppointmentHeader.css';

/**
 * AppointmentHeader Molecule (Internal to feature).
 * Displays patient info and quick actions for an appointment.
 */
const AppointmentHeader = ({ appt, t, onWhatsApp }) => {
    const { showMessage } = useMessage();
    const { alert } = useModal();

    const handleCopyPhone = () => {
        copyToClipboard(appt.patient_phone).then(() => showMessage(t('phone_copied'), "success"));
    };

    const baseClass = 'appointment-header';

    return (
        <div className={baseClass}>
            <div className={`${baseClass}__patient-info`}>
                <p className={`${baseClass}__text`}>
                    <strong className={`${baseClass}__strong`}>{t('patient_label')}:</strong> {appt.patient_name || appt.reason || t('sync_required') || 'Sincronización requerida'}
                </p>
                {appt.patient_phone && (
                    <div className={`${baseClass}__phone-row`}>
                        <strong className={`${baseClass}__label`}>{t('phone_label') || t('phone')}:</strong>
                        <Button
                            to={`tel:${appt.patient_phone.replace(/[^0-9+]/g, '')}`}
                            variant="phone"
                            size="md"
                            className={`${baseClass}__phone-link`}
                            onClick={(e) => e.stopPropagation()}
                            icon={<Icon name="call" size="0.9rem" />}
                        >
                            {appt.patient_phone}
                        </Button>
                        <div className={`${baseClass}__phone-actions`}>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className={`${baseClass}__icon-btn`}
                                onClick={handleCopyPhone}
                                title={t('copy_phone')}
                                icon={<Icon name="content_copy" size="1rem" />}
                            />
                            {appt.status !== 'completed' && (
                                <>
                                    <Button
                                        variant="whatsapp"
                                        size="sm-compact"
                                        className={`${baseClass}__icon-btn ${baseClass}__icon-btn--whatsapp`}
                                        onClick={() => onWhatsApp(appt, 'reminder')}
                                        title={t('whatsapp_reminder')}
                                        icon={<Icon name="send" size="1rem" />} 
                                    />
                                    <Button
                                        variant="accent"
                                        size="sm-compact"
                                        className={`${baseClass}__icon-btn ${baseClass}__icon-btn--magic`}
                                        onClick={() => onWhatsApp(appt, 'confirmation')}
                                        title={t('whatsapp_proof')}
                                        icon={<Icon name="auto_awesome" size="1rem" />}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}
                <p className={`${baseClass}__date`}>
                    <strong className={`${baseClass}__strong`}>{t('date_label')}:</strong> {formatDate(appt.appointment_date, true)}
                </p>
            </div>

            <div className={`${baseClass}__badges`}>
                <Badge variant={appt.status}>
                    {t(appt.status) || appt.status}
                </Badge>
                <Badge variant={appt.payment_status === 'paid' ? 'green' : 'red'}>
                    {t(appt.payment_status) || appt.payment_status}
                </Badge>
                {(appt.bonified === 1 || appt.bonified === true) && (
                    <Badge variant="accent">
                        {t('bonified') || 'Bonificado'}
                    </Badge>
                )}
            </div>
        </div>
    );
};

export default AppointmentHeader;
