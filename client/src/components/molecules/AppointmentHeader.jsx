import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { useMessage } from '../../context/MessageContext';

import { formatDate } from '../../utils/format';

const AppointmentHeader = ({ appt, t, onWhatsApp }) => {
    const { showMessage } = useMessage();

    const handleCopyPhone = () => {
        copyToClipboard(appt.patient_phone).then(() => showMessage("Teléfono copiado", "success"));
    };

    return (
        <div className="appointment-modal__header">
            <div className="appointment-modal__patient-info">
                <p className="appointment-modal__text">
                    <strong className="appointment-modal__strong">{t('patient_label') || 'Paciente'}:</strong> {appt.patient_name || appt.reason || 'Sincronización requerida'}
                </p>
                {appt.patient_phone && (
                    <div className="appointment-modal__phone-row">
                        <strong className="appointment-modal__label">{t('phone') || 'Teléfono'}:</strong>
                        <span className="appointment-modal__phone-number">{appt.patient_phone}</span>
                        <div className="appointment-modal__phone-actions">
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className="appointment-modal__icon-btn"
                                onClick={handleCopyPhone}
                                title={t('copy_phone') || "Copiar Número"}
                            >
                                📋
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className="appointment-modal__icon-btn appointment-modal__icon-btn--whatsapp"
                                onClick={() => onWhatsApp(appt, 'reminder')}
                                title={t('whatsapp_reminder') || "Enviar Recordatorio WhatsApp"}
                            >
                                📲
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className="appointment-modal__icon-btn appointment-modal__icon-btn--magic"
                                onClick={() => onWhatsApp(appt, 'confirmation')}
                                title={t('whatsapp_proof') || "Enviar Comprobante WhatsApp"}
                            >
                                ✨
                            </Button>
                        </div>
                    </div>
                )}
                <p className="appointment-modal__date">
                    <strong className="appointment-modal__strong">{t('date_label')}:</strong> {formatDate(appt.appointment_date, true)}
                </p>
            </div>

            <div className="appointment-modal__badges">
                <Badge variant={appt.status}>
                    {t(appt.status) || appt.status}
                </Badge>
                <Badge variant={appt.payment_status === 'paid' ? 'green' : 'red'}>
                    {t(appt.payment_status) || appt.payment_status}
                </Badge>
            </div>
        </div>
    );
};

export default AppointmentHeader;
