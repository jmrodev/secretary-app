import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { printInvoice } from '@/utils/printing/printInvoice';
import styles from './InvoiceDetailContent.module.css';

/**
 * InvoiceDetailContent Feature Molecule.
 * Modal content for viewing and printing generated invoices within the finances domain.
 */
export const InvoiceDetailContent = ({ tx, formatDate }) => {
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
        <div className={`${styles.root} animate-fade-in`}>
            <h3 className={`${styles.title}`}>Detalle de Transacción</h3>
            <div className={`${styles.content}`}>
                <p className={`${styles.row}`}>
                    <strong>Fecha y Hora:</strong> 
                    <span>{formatDate(tx.transaction_date, { fallback: '-' })}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Descripción:</strong> 
                    <span>{tx.description}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Beneficiario / Paciente:</strong> 
                    <span>{tx.patient_full_name || tx.doctor_name || 'Clínica General'}</span>
                </p>
                {tx.doctor_name && tx.patient_full_name && (
                    <p className={`${styles.row}`}>
                        <strong>Médico a cargo:</strong> 
                        <span>Dr. {tx.doctor_name}</span>
                    </p>
                )}
                
                <hr className={`${styles.divider}`} />

                <p className={`${styles.row}`}>
                    <strong>Método de Pago:</strong> 
                    <span style={{ textTransform: 'capitalize' }}>{tx.method || 'Efectivo'}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Estado de Pago:</strong> 
                    <span className={`${styles.statusBadge} ${tx.bonified === 1 ? styles.statusBonified : (tx.status === 'paid' ? styles.statusPaid : styles.statusPending)}`}>
                        {tx.bonified === 1 ? 'Bonificado' : (tx.status === 'paid' ? 'Pagado' : tx.status)}
                    </span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Monto Total:</strong> 
                    <span className={`${styles.amount}`}>${Number(tx.amount).toLocaleString()}</span>
                </p>

                {tx.proof_file && (
                    <p className={`${styles.row}`}>
                        <strong>Comprobante Adjunto:</strong> 
                        <a href={tx.proof_file} target="_blank" rel="noreferrer" style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'underline' }}>
                            Ver Archivo
                        </a>
                    </p>
                )}

                {tx.invoice_number && (
                    <>
                        <hr className={`${styles.divider}`} />
                        <h4 className={styles.afipHeader}>Factura Electrónica (AFIP)</h4>
                        <p className={`${styles.row}`}>
                            <strong>Comprobante:</strong> 
                            <span>Factura {tx.invoice_cbte_tipo === 11 ? 'C' : tx.invoice_cbte_tipo} N° {String(tx.invoice_punto_vta).padStart(4, '0')}-{String(tx.invoice_number).padStart(8, '0')}</span>
                        </p>
                        <p className={`${styles.row}`}>
                            <strong>CAE / Vencimiento:</strong> 
                            <span>{tx.invoice_cae} (Vto: {formatDate(tx.invoice_cae_vto, { fallback: '-' })})</span>
                        </p>
                    </>
                )}
            </div>
            <div className={`${styles.actions}`}>
                {tx.invoice_number && (
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handlePrint}
                        icon={<Icon name="PRINT" size="1.2rem" />}
                    >
                        Imprimir Factura
                    </Button>
                )}
            </div>
        </div>
    );
};

