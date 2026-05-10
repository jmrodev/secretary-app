import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { printInvoice } from '@/utils/printing/printInvoice';
import './InvoiceDetailContent.css';

/**
 * InvoiceDetailContent Feature Molecule.
 * Modal content for viewing and printing generated invoices within the finances domain.
 * Refactored to follow BEM and Atomic Design standards.
 */
const InvoiceDetailContent = ({ tx, formatDate }) => {
    return (
        <div className="invoice-detail animate-fade-in">
            <h3 className="invoice-detail__title">Comprobante Electrónico</h3>
            <div className="invoice-detail__content">
                <p className="invoice-detail__row">
                    <strong>Tipo:</strong> 
                    <span>Factura {tx.invoice_cbte_tipo === 11 ? 'C' : tx.invoice_cbte_tipo}</span>
                </p>
                <p className="invoice-detail__row">
                    <strong>Número:</strong> 
                    <span>{String(tx.invoice_punto_vta).padStart(4, '0')}-{String(tx.invoice_number).padStart(8, '0')}</span>
                </p>
                <p className="invoice-detail__row">
                    <strong>CAE:</strong> 
                    <span>{tx.invoice_cae}</span>
                </p>
                <p className="invoice-detail__row">
                    <strong>Vto. CAE:</strong> 
                    <span>{formatDate(tx.invoice_cae_vto, { fallback: '-' })}</span>
                </p>
                
                <hr className="invoice-detail__divider" />
                
                <p className="invoice-detail__row">
                    <strong>Paciente:</strong> 
                    <span>{tx.patient_full_name}</span>
                </p>
                <p className="invoice-detail__row">
                    <strong>Médico:</strong> 
                    <span>{tx.doctor_name}</span>
                </p>
                <p className="invoice-detail__row">
                    <strong>Monto Total:</strong> 
                    <span className="invoice-detail__amount">${Number(tx.amount).toLocaleString()}</span>
                </p>
            </div>
            <div className="invoice-detail__actions">
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => printInvoice({
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
                    })}
                    icon={<Icon name="PRINT" size="1.2rem" />}
                >
                    Imprimir Factura
                </Button>
            </div>
        </div>
    );
};

export default InvoiceDetailContent;
