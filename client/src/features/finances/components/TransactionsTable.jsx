import React, { useMemo } from 'react';
import Card from '@/components/atoms/Card';
import { formatTime } from '@/utils/dateUtils';
import Pagination from '@/components/atoms/Pagination';

// Local Feature Components
import TransactionRow from './TransactionRow';

import './TransactionsTable.css';

/**
 * TransactionsTable Feature Organism.
 * Main ledger display for financial audit and cash control.
 * Handles grouping of fractional payments and system descriptions.
 */
const TransactionsTable = ({
    transactions,
    totalCount,
    currentPage,
    totalPages,
    onPageChange,
    user,
    settings,
    t,
    onEdit,
    onDelete,
    onGenerateInvoice,
    onSync,
    alert
}) => {

    /**
     * Specialized date formatter for the ledger view.
     */
    const formatDateUnambiguous = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = d.getDate().toString().padStart(2, '0');
        const months = t('months_array') || [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear();

        const format = t('date_format_long') || "{day} {month} {year}";
        return format.replace('{day}', day).replace('{month}', month).replace('{year}', year);
    };

    /**
     * Translates internal system-generated descriptions.
     */
    const translateDescription = (desc) => {
        if (!desc) return "";
        let d = desc;
        const transTable = [
            { k: "Consultation (Booking)", v: t('consultation_booking') || "Consulta (Reserva)" },
            { k: "Consultation (Patient Share)", v: t('consultation_patient_share') || "Consulta (Parte del Paciente)" },
            { k: "Consultation (Institution Share)", v: t('consultation_institution_share') || "Consulta (Parte de Institución)" },
            { k: "Payment for appointment on", v: t('payment_appointment_on') || "Pago por turno del" },
            { k: "Cash Box Delivery to Dr.", v: t('cash_box_delivery_to') || "Entrega de caja al Dr." },
            { k: "Request: license for", v: t('request_license_for') || "Solicitud: licencia para" },
            { k: "Request: prescription for", v: t('request_prescription_for') || "Solicitud: receta para" },
            { k: "- Paid Part by Inst", v: `- ${t('paid_part_inst') || 'Pago Parcial (Inst.)'}` },
            { k: "- Paid by Inst", v: `- ${t('paid_inst') || 'Pagado (Inst.)'}` },
            { k: "- Paid Part", v: `- ${t('paid_part') || 'Pago Parcial'}` },
            { k: "- Paid", v: `- ${t('paid') || 'Pagado'}` },
            { k: "Advance Payment / Credit", v: t('advance_payment') || 'Pago Adelantado / Saldo a Favor' },
            { k: "DEBT:", v: t('debt_tag') || 'DEUDA:' },
            { k: "Virtual Share:", v: t('virtual_share') || 'Virtual:' },
            { k: "Presencial Share:", v: t('presencial_share') || 'Presencial:' },
            { k: "Virtual Institution Share:", v: t('virtual_institution_share') || 'Virtual (Inst.):' },
            { k: "Presencial Institution Share:", v: t('presencial_institution_share') || 'Presencial (Inst.):' },
            { k: "Saldo a favor (Turno Eliminado):", v: t('credit_balance_deleted') || 'Saldo a favor (Turno Eliminado):' }
        ];

        transTable.forEach(item => {
            if (d.includes(item.k)) {
                d = d.replace(item.k, item.v);
            }
        });
        return d;
    };

    /**
     * Highlighting logic for patient names in transactional descriptions.
     */
    const highlightPatientName = (description, patientName) => {
        if (!description || !patientName) return description;

        const escapedName = patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedName})`, 'gi');

        const parts = description.split(regex);
        return parts.map((part, i) =>
            part.toLowerCase() === patientName.toLowerCase()
                ? <strong key={i} className="transactions-table__highlight">{part}</strong>
                : part
        );
    };

    /**
     * Memoized grouping logic for aesthetic and conceptual grouping of split payments.
     */
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

    const canManagerFinance = user && (user.role === 'admin' || settings.enable_secretary_finance_crud === 'true');

    return (
        <Card className="transactions-table__container no-padding" title={t('transaction_log')}>
            <div className="transactions-table__wrapper">
                <table className="transactions-table__table table-base">
                    <thead>
                        <tr>
                            <th className="transactions-table__cell--first">{t('date_label')}</th>
                            <th className="transactions-table__header-cell--description">{t('description')}</th>
                            <th>{t('beneficiary')}</th>
                            <th>{t('payment_method')}</th>
                            <th>{t('status') || 'Estado'}</th>
                            <th className="transactions-table__cell--right">{t('amount')}</th>
                            <th className="transactions-table__cell--center">{t('proof')}</th>
                            {canManagerFinance && (
                                <th className="transactions-table__cell--right transactions-table__cell--last">{t('actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={canManagerFinance ? 8 : 7} className="transactions-table__cell--center transactions-table__cell--empty-state">
                                    {t('no_transactions_found') || 'No hay transacciones registradas.'}
                                </td>
                            </tr>
                        ) : (
                            groupedTransactions.map((group, gIdx) => (
                                <React.Fragment key={`group-${gIdx}`}>
                                    {group.map((tx) => (
                                        <TransactionRow
                                            key={tx.id}
                                            tx={tx}
                                            groupLength={group.length}
                                            canManagerFinance={canManagerFinance}
                                            formatDateUnambiguous={formatDateUnambiguous}
                                            formatTime={formatTime}
                                            translateDescription={translateDescription}
                                            highlightPatientName={highlightPatientName}
                                            onGenerateInvoice={onGenerateInvoice}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                            onSync={onSync}
                                            alert={alert}
                                            t={t}
                                        />
                                    ))}
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
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    t={t}
                />
            )}
        </Card>
    );
};

export default TransactionsTable;
