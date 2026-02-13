import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import Icon from '../atoms/Icon';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { useMessage } from '../../context/MessageContext';
import { useModal } from '../../context/ModalContext';
import { formatDate } from '../../utils/format';
import { printInvoice } from '../../utils/printInvoice';
import './AppointmentHeader.css';

/**
 * AppointmentHeader Molecule.
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
                        <a
                            href={`tel:${appt.patient_phone.replace(/[^0-9+]/g, '')}`}
                            className={`${baseClass}__phone-link`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {appt.patient_phone}
                        </a>
                        <div className={`${baseClass}__phone-actions`}>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className={`${baseClass}__icon-btn`}
                                onClick={handleCopyPhone}
                                title={t('copy_phone')}
                                icon={<Icon name="content_copy" size="1rem" />}
                            />
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className={`${baseClass}__icon-btn ${baseClass}__icon-btn--whatsapp`}
                                onClick={() => onWhatsApp(appt, 'reminder')}
                                title={t('whatsapp_reminder')}
                                icon={<Icon name="send" size="1rem" />} // No brand icons in Material Symbols usually, using send
                            />
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className={`${baseClass}__icon-btn ${baseClass}__icon-btn--magic`}
                                onClick={() => onWhatsApp(appt, 'confirmation')}
                                title={t('whatsapp_proof')}
                                icon={<Icon name="auto_awesome" size="1rem" />}
                            />

                            {appt.invoice_number && (
                                <Button
                                    variant="ghost"
                                    size="sm-compact"
                                    className={`${baseClass}__icon-btn`}
                                    title={t('view_electronic_invoice')}
                                    onClick={() => alert(
                                        <div className="invoice-detail">
                                            <h3 className="invoice-detail__title">{t('electronic_proof_title')}</h3>
                                            <div className="invoice-detail__content">
                                                <p className="invoice-detail__row"><strong>{t('invoice_type')}:</strong> Factura {appt.invoice_cbte_tipo === 11 ? 'C' : appt.invoice_cbte_tipo}</p>
                                                <p className="invoice-detail__row"><strong>{t('invoice_number')}:</strong> {String(appt.invoice_punto_vta).padStart(4, '0')}-{String(appt.invoice_number).padStart(8, '0')}</p>
                                                <p className="invoice-detail__row"><strong>{t('invoice_cae') || 'CAE'}:</strong> {appt.invoice_cae}</p>
                                                <p className="invoice-detail__row"><strong>{t('invoice_cae_vto')}:</strong> {appt.invoice_cae_vto ? new Date(appt.invoice_cae_vto).toLocaleDateString() : '-'}</p>
                                                <hr className="invoice-detail__divider" />
                                                <p className="invoice-detail__row"><strong>{t('patient_label')}:</strong> {appt.patient_name}</p>
                                                <p className="invoice-detail__row"><strong>{t('doctor_label')}:</strong> {appt.doctor_name}</p>
                                                <p className="invoice-detail__row"><strong>{t('amount_paid')}:</strong> ${appt.paid_amount}</p>
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
                                                    icon={<Icon name="print" />}
                                                >
                                                    {t('invoice_print')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    icon={<Icon name="receipt" size="1rem" />}
                                />
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
            </div>
        </div>
    );
};


export default AppointmentHeader;
