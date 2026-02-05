import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { useMessage } from '../../context/MessageContext';

import { useModal } from '../../context/ModalContext';
import { formatDate } from '../../utils/format';
import { printInvoice } from '../../utils/printInvoice';
import './AppointmentHeader.css';

const AppointmentHeader = ({ appt, t, onWhatsApp }) => {
    const { showMessage } = useMessage();
    const { alert } = useModal();

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

                            {appt.invoice_number && (
                                <Button
                                    variant="ghost"
                                    size="sm-compact"
                                    className="appointment-modal__icon-btn"
                                    title="Ver Factura Electrónica"
                                    onClick={() => alert(
                                        <div className="invoice-detail">
                                            <h3 className="invoice-detail__title">Comprobante Electrónico</h3>
                                            <div className="invoice-detail__content">
                                                <p className="invoice-detail__row"><strong>Tipo:</strong> Factura {appt.invoice_cbte_tipo === 11 ? 'C' : appt.invoice_cbte_tipo}</p>
                                                <p className="invoice-detail__row"><strong>Número:</strong> {String(appt.invoice_punto_vta).padStart(4, '0')}-{String(appt.invoice_number).padStart(8, '0')}</p>
                                                <p className="invoice-detail__row"><strong>CAE:</strong> {appt.invoice_cae}</p>
                                                <p className="invoice-detail__row"><strong>Vto. CAE:</strong> {appt.invoice_cae_vto ? new Date(appt.invoice_cae_vto).toLocaleDateString() : '-'}</p>
                                                <hr className="invoice-detail__divider" />
                                                <p className="invoice-detail__row"><strong>Paciente:</strong> {appt.patient_name}</p>
                                                <p className="invoice-detail__row"><strong>Médico:</strong> {appt.doctor_name}</p>
                                                <p className="invoice-detail__row"><strong>Monto Pagado:</strong> ${appt.paid_amount}</p>
                                            </div>
                                            <div className="invoice-detail__actions">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => printInvoice({
                                                        ptoVta: appt.invoice_punto_vta,
                                                        number: appt.invoice_number,
                                                        cbteTipo: appt.invoice_cbte_tipo,
                                                        cae: appt.invoice_cae,
                                                        vto: appt.invoice_cae_vto,
                                                        patient: appt.patient_name,
                                                        patientDni: appt.patient_dni,
                                                        doctor: appt.doctor_name,
                                                        doctorCuit: appt.doctor_cuit,
                                                        amount: appt.paid_amount
                                                    })}
                                                >
                                                    🖨️ Imprimir Factura
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                >
                                    🧾
                                </Button>
                            )}
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
