import React from 'react';
import Button from '../atoms/Button';
import { printInvoice } from '../../utils/printInvoice';

/**
 * InvoiceDetailContent Molecule.
 * Content for the invoice detail view, including a print action.
 */
const InvoiceDetailContent = ({ tx, formatDate }) => {
    return (
        <div className="invoice-detail">
            <h3 className="invoice-detail__title">Comprobante Electrónico</h3>
            <div className="invoice-detail__content">
                <p className="invoice-detail__row"><strong>Tipo:</strong> Factura {tx.invoice_cbte_tipo === 11 ? 'C' : tx.invoice_cbte_tipo}</p>
                <p className="invoice-detail__row"><strong>Número:</strong> {String(tx.invoice_punto_vta).padStart(4, '0')}-{String(tx.invoice_number).padStart(8, '0')}</p>
                <p className="invoice-detail__row"><strong>CAE:</strong> {tx.invoice_cae}</p>
                <p className="invoice-detail__row"><strong>Vto. CAE:</strong> {formatDate(tx.invoice_cae_vto, { fallback: '-' })}</p>
                <hr className="invoice-detail__divider" />
                <p className="invoice-detail__row"><strong>Paciente:</strong> {tx.patient_full_name}</p>
                <p className="invoice-detail__row"><strong>Médico:</strong> {tx.doctor_name}</p>
                <p className="invoice-detail__row"><strong>Monto Total:</strong> ${tx.amount}</p>
            </div>
            <div className="invoice-detail__actions">
                <Button
                    variant="primary"
                    size="sm"
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
                    icon="🖨️"
                >
                    Imprimir Factura
                </Button>
            </div>
        </div>
    );
};

export default InvoiceDetailContent;
