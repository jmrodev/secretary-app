import React, { useMemo } from 'react';
import Button from '../atoms/Button';
import Card from '../atoms/Card';
import { printInvoice } from '../../utils/printInvoice';
import { formatDate, formatTime } from '../../utils/dateUtils';
import './TransactionsTable.css';

const TransactionsTable = ({
    transactions,
    user,
    settings,
    t,
    onEdit,
    onDelete,
    onGenerateInvoice,
    onSync,
    alert
}) => {

    const formatDateUnambiguous = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = d.getDate().toString().padStart(2, '0');
        const monthKey = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ][d.getMonth()];
        const month = t(monthKey);
        const year = d.getFullYear();

        const format = t('date_format_long') || "{day} {month} {year}";
        return format.replace('{day}', day).replace('{month}', month).replace('{year}', year);
    };

    const translateDescription = (desc) => {
        if (!desc) return "";
        let d = desc;
        const transTable = [
            { k: "Consultation (Booking)", v: t('consultation_booking') || "Consulta (Reserva)" },
            { k: "Consultation (Patient Share)", v: t('consultation_patient_share') || "Consulta (Parte Paciente)" },
            { k: "Consultation (Institution Share)", v: t('consultation_institution_share') || "Consulta (Parte Institución)" },
            { k: "Payment for appointment on", v: t('payment_appointment_on') || "Pago por turno del" },
            { k: "Cash Box Delivery to Dr.", v: t('cash_box_delivery_to') || "Entrega de Caja al Dr." },
            { k: "Request: license for", v: t('request_license_for') || "Solicitud: licencia para" },
            { k: "Request: prescription for", v: t('request_prescription_for') || "Solicitud: receta para" },
            { k: "- Paid", v: `- ${t('paid')}` }
        ];

        transTable.forEach(item => {
            if (d.includes(item.k)) {
                d = d.replace(item.k, item.v);
            }
        });
        return d;
    };

    const groupedTransactions = useMemo(() => {
        const groups = [];
        let currentGroup = [];
        let lastKey = null;

        transactions.forEach(tx => {
            let key = null;
            if (tx.appointment_id) key = `appt_${tx.appointment_id}`;
            else if (tx.request_id) key = `req_${tx.request_id}`;
            else key = `gen_${tx.transaction_date}_${tx.doctor_id}_${tx.description}`;

            if (key !== lastKey) {
                if (currentGroup.length > 0) groups.push(currentGroup);
                currentGroup = [tx];
                lastKey = key;
            } else {
                currentGroup.push(tx);
            }
        });
        if (currentGroup.length > 0) groups.push(currentGroup);
        return groups;
    }, [transactions]);

    const canManagerFinance = user.role === 'admin' || settings.enable_secretary_finance_crud === 'true';

    return (
        <Card className="transactions-table__container" title={t('transaction_log')}>
            <div className="transactions-table__wrapper">
                <table className="transactions-table__table">
                    <thead>
                        <tr>
                            <th className="pl-6-bem">{t('date_label')}</th>
                            <th style={{ width: '30%' }}>{t('description')}</th>
                            <th>{t('beneficiary')}</th>
                            <th>{t('payment_method')}</th>
                            <th>{t('status') || 'Estado'}</th>
                            <th className="transactions-table__header-cell--right">{t('amount')}</th>
                            <th className="transactions-table__header-cell--center">{t('proof')}</th>
                            {canManagerFinance && (
                                <th className="transactions-table__header-cell--right pr-6-bem">{t('actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={canManagerFinance ? 8 : 7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    {t('no_transactions_found') || 'No hay transacciones registradas.'}
                                </td>
                            </tr>
                        ) : (
                            groupedTransactions.map((group, gIdx) => (
                                <React.Fragment key={`group-${gIdx}`}>
                                    {group.map((tx) => {
                                        const isIncome = tx.type.includes('income') && !tx.is_withdrawal;
                                        const isGrouped = group.length > 1;

                                        return (
                                            <tr key={tx.id} className={isGrouped ? 'transactions-table__row--grouped' : ''}>
                                                <td className="pl-6-bem">
                                                    <div className="transactions-table__date">{formatDateUnambiguous(tx.transaction_date)}</div>
                                                    <div className="transactions-table__time">
                                                        {formatTime(tx.transaction_date)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="transactions-table__description-wrapper">
                                                        <span className={`tag tag-${isIncome ? 'completed' : 'rejected'} transactions-table__type-tag`}>
                                                            {tx.appointment_id
                                                                ? (t('appointment') || 'Turno')
                                                                : tx.request_type
                                                                    ? (t(tx.request_type) || tx.request_type)
                                                                    : (t(tx.type) || tx.type.replace('_', ' '))
                                                            }
                                                        </span>
                                                        <span className="transactions-table__description">{translateDescription(tx.description)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="transactions-table__beneficiary">
                                                        <span className="transactions-table__beneficiary-name">
                                                            {tx.patient_full_name ? `🧑 ${tx.patient_full_name}` : (tx.doctor_name || t('general'))}
                                                        </span>
                                                        {tx.patient_full_name && tx.doctor_name && (
                                                            <span className="transactions-table__patient">
                                                                {tx.doctor_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="transactions-table__method">
                                                        <span>{t(tx.method) || tx.method}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge-mini status-${tx.status}`}>
                                                        {t(tx.status) || (tx.status === 'paid' ? 'Pagado' : 'Pendiente')}
                                                    </span>
                                                </td>
                                                <td className={`transactions-table__amount ${tx.is_withdrawal ? 'transactions-table__amount--withdrawal' : (isIncome ? 'transactions-table__amount--income' : 'transactions-table__amount--expense')}`}>
                                                    {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
                                                </td>
                                                <td className="transactions-table__cell--center">
                                                    {tx.invoice_number ? (
                                                        <div className="transactions-table__invoice-info">
                                                            <span className="transactions-table__invoice-number">
                                                                {String(tx.invoice_punto_vta).padStart(4, '0')}-{String(tx.invoice_number).padStart(8, '0')}
                                                            </span>
                                                            <Button
                                                                size="sm-compact"
                                                                variant="ghost"
                                                                onClick={() => alert(
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
                                                                )}
                                                                title="Ver Detalle"
                                                            >
                                                                📄 Ver
                                                            </Button>
                                                        </div>
                                                    ) : tx.proof_file ? (
                                                        <a href={tx.proof_file} target="_blank" rel="noreferrer" className="btn-text" title={t('view')}>
                                                            📁
                                                        </a>
                                                    ) : <span className="transactions-table__no-proof">-</span>}
                                                </td>
                                                {canManagerFinance && (
                                                    <td className="transactions-table__cell--right pr-6-bem">
                                                        <div className="transactions-table__actions">
                                                            {tx.type === 'income_patient' && tx.status === 'paid' && !tx.invoice_number && (
                                                                <Button size="sm-compact" variant="ghost" onClick={() => onGenerateInvoice(tx.id)} title="Generar Factura" icon="🧾" />
                                                            )}
                                                            <Button size="sm-compact" variant="ghost" onClick={() => onEdit(tx)} title={t('edit')} icon="✏️" />
                                                            {tx.status === 'paid' && (
                                                                <Button size="sm-compact" variant="ghost" onClick={() => onSync(tx.id)} title="Sincronizar con Google" icon="☁️" />
                                                            )}
                                                            <Button size="sm-compact" variant="ghost" onClick={() => onDelete(tx.id)} title={t('delete')} icon="🗑️" />
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    {group.length > 1 && (
                                        <tr className="transactions-table__group-footer">
                                            <td colSpan={canManagerFinance ? 8 : 7} className="transactions-table__group-total">
                                                {t('group_total')}: ${group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default TransactionsTable;
