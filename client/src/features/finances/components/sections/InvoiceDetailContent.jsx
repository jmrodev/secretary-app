import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { printInvoice } from '@/utils/printing/printInvoice';
import styles from './InvoiceDetailContent.module.css';

/**
 * InvoiceDetailContent Feature Molecule.
 * Modal content for viewing and printing generated invoices within the finances domain.
 */
const InvoiceDetailContent = ({ tx, formatDate }) => {
    const handlePrint = () => {
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
            <h3 className={`${styles.title}`}>Comprobante Electrónico</h3>
            <div className={`${styles.content}`}>
                <p className={`${styles.row}`}>
                    <strong>Tipo:</strong> 
                    <span>Factura {tx.invoice_cbte_tipo === 11 ? 'C' : tx.invoice_cbte_tipo}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Número:</strong> 
                    <span>{String(tx.invoice_punto_vta).padStart(4, '0')}-{String(tx.invoice_number).padStart(8, '0')}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>CAE:</strong> 
                    <span>{tx.invoice_cae}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Vto. CAE:</strong> 
                    <span>{formatDate(tx.invoice_cae_vto, { fallback: '-' })}</span>
                </p>
                
                <hr className={`${styles.divider}`} />
                
                <p className={`${styles.row}`}>
                    <strong>Paciente:</strong> 
                    <span>{tx.patient_full_name}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Médico:</strong> 
                    <span>{tx.doctor_name}</span>
                </p>
                <p className={`${styles.row}`}>
                    <strong>Monto Total:</strong> 
                    <span className={`${styles.amount}`}>${Number(tx.amount).toLocaleString()}</span>
                </p>
            </div>
            <div className={`${styles.actions}`}>
                <Button
                    variant="primary"
                    size="md"
                    onClick={handlePrint}
                    icon={<Icon name="PRINT" size="1.2rem" />}
                >
                    Imprimir Factura
                </Button>
            </div>
        </div>
    );
};

export default InvoiceDetailContent;
