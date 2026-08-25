import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { printInvoice } from '@/utils/printing/printInvoice';
import styles from './InvoiceDetailContent.module.css';

/**
 * InvoiceDetailContent Feature Molecule.
 * Modal content for viewing and printing generated invoices within the finances domain.
 */
export const InvoiceDetailContent = ({ tx, formatDate }) => {
    const { t } = useLanguage();

    const handlePrint = () => {
        if (!tx.invoice_number) return;
        printInvoice({
            ptoVta: tx.invoice_punto_vta,
            number: tx.invoice_number,
            cbteTipo: tx.invoice_cbte_tipo,
            cae: tx.invoice_cae,
            vto: tx.invoice_cae_vto,
            fecha: tx.transaction_date ? new Date(tx.transaction_date).toISOString().split('T')[0] : null,
            patient: tx.patient_full_name,
            patientDni: tx.patient_dni,
            doctor: tx.doctor_name,
            doctorCuit: tx.doctor_cuit,
            amount: tx.amount
        });
    };

    return (
        <div className={`${styles.InvoiceDetailContent__root} animate-fade-in`}>
            <h3 className={`${styles.InvoiceDetailContent__title}`}>{t('transaction_detail') || 'Detalle de Transacción'}</h3>
            <div className={`${styles.InvoiceDetailContent__content}`}>
                <p className={`${styles.InvoiceDetailContent__row}`}>
                    <strong>{t('date_time') || 'Fecha y Hora'}:</strong> 
                    <span>{formatDate(tx.transaction_date, { fallback: '-' })}</span>
                </p>
                <p className={`${styles.InvoiceDetailContent__row}`}>
                    <strong>{t('description')}:</strong> 
                    <span>{tx.description}</span>
                </p>
                <p className={`${styles.InvoiceDetailContent__row}`}>
                    <strong>{t('beneficiary_patient') || 'Beneficiario / Paciente'}:</strong> 
                    <span>{tx.patient_full_name || tx.doctor_name || t('general_clinic') || 'Clínica General'}</span>
                </p>
                {tx.doctor_name && tx.patient_full_name && (
                    <p className={`${styles.InvoiceDetailContent__row}`}>
                        <strong>{t('doctor_in_charge') || 'Médico a cargo'}:</strong> 
                        <span>Dr. {tx.doctor_name}</span>
                    </p>
                )}
                
                <hr className={`${styles.InvoiceDetailContent__divider}`} />

                <p className={`${styles.InvoiceDetailContent__row}`}>
                    <strong>{t('payment_method') || 'Método de Pago'}:</strong> 
                    <span style={{ textTransform: 'capitalize' }}>{tx.method || t('cash') || 'Efectivo'}</span>
                </p>
                <p className={`${styles.InvoiceDetailContent__row}`}>
                    <strong>{t('payment_status') || 'Estado de Pago'}:</strong> 
                    <span className={`${styles.InvoiceDetailContent__statusBadge} ${tx.bonified === 1 ? styles.InvoiceDetailContent__statusBonified : (tx.status === 'paid' ? styles.InvoiceDetailContent__statusPaid : styles.InvoiceDetailContent__statusPending)}`}>
                        {tx.bonified === 1 ? (t('bonified') || 'Bonificado') : (tx.status === 'paid' ? (t('paid') || 'Pagado') : tx.status)}
                    </span>
                </p>
                <p className={`${styles.InvoiceDetailContent__row}`}>
                    <strong>{t('total_amount') || 'Monto Total'}:</strong> 
                    <span className={`${styles.InvoiceDetailContent__amount}`}>${Number(tx.amount).toLocaleString()}</span>
                </p>

                {tx.proof_file && (
                    <p className={`${styles.InvoiceDetailContent__row}`}>
                        <strong>{t('proof_file_attached') || 'Comprobante Adjunto'}:</strong> 
                        <a href={tx.proof_file} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}>
                            {t('view_file') || 'Ver Archivo'}
                        </a>
                    </p>
                )}

                {tx.invoice_number && (
                    <>
                        <hr className={`${styles.InvoiceDetailContent__divider}`} />
                        <h4 className={styles.InvoiceDetailContent__afipHeader}>{t('electronic_invoice_afip') || 'Factura Electrónica (AFIP)'}</h4>
                        <p className={`${styles.InvoiceDetailContent__row}`}>
                            <strong>{t('invoice_type') || 'Comprobante'}:</strong> 
                            <span>{t('invoice') || 'Factura'} {tx.invoice_cbte_tipo === 11 ? 'C' : tx.invoice_cbte_tipo} N° {String(tx.invoice_punto_vta).padStart(4, '0')}-{String(tx.invoice_number).padStart(8, '0')}</span>
                        </p>
                        <p className={`${styles.InvoiceDetailContent__row}`}>
                            <strong>{t('invoice_cae_vto') || 'CAE / Vencimiento'}:</strong> 
                            <span>{tx.invoice_cae} (Vto: {formatDate(tx.invoice_cae_vto, { fallback: '-' })})</span>
                        </p>
                    </>
                )}
            </div>
            <div className={`${styles.InvoiceDetailContent__actions}`}>
                {tx.invoice_number && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handlePrint}
                        icon={<Icon name="PRINT" size="1.2rem" />}
                    >
                        {t('print_invoice') || 'Imprimir Factura'}
                    </Button>
                )}
            </div>
        </div>
    );
};

