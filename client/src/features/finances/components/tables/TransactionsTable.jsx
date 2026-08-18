import React, { useMemo } from 'react';
import { Card } from '@/components/atoms/Card';
import { formatTime, parseDate } from '@/utils/core/dateUtils';
import { Pagination } from '@/components/atoms/Pagination';

// Local Feature Components
import { TransactionRow } from '@/features/finances/components/tables/TransactionRow';

import styles from './TransactionsTable.module.css';

/**
 * TransactionsTable Feature Organism.
 * Main ledger display for financial audit and cash control.
 * Handles grouping of fractional payments and system descriptions.
 */
export const TransactionsTable = ({
    transactions,
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
        const d = parseDate(dateStr);
        if (!d || isNaN(d.getTime())) return dateStr;
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
    const transTable = React.useMemo(() => [
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
    ], [t]);

    const translateDescription = (desc) => {
        if (!desc) return "";
        let d = desc;
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
        return parts.map((part, i) => {
            const partKey = `part-${i}-${part.length}`;
            return part.toLowerCase() === patientName.toLowerCase()
                ? <strong key={partKey} className={`${styles.TransactionsTable__highlight}`}>{part}</strong>
                : part;
        });
    };

    /**
     * Memoized grouping logic for aesthetic and conceptual grouping of split payments.
     */
    const groupedTransactions = useMemo(() => {
        const groups = [];
        let currentGroup = [];
        let lastKey = null;

        transactions.forEach(tx => {
            let key;
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
        <Card className={`${styles.TransactionsTable__container}`} noPadding as="article">
            <div className={`${styles.TransactionsTable__wrapper}`}>
                <table className={`${styles.TransactionsTable__table} table-base`}>
                    <thead>
                        <tr>
                            <th className={`${styles.TransactionsTable__cellFirst}`}>{t('date_label')}</th>
                            <th className="transactions-table__header-cell--description">{t('description')}</th>
                            <th>{t('beneficiary')}</th>
                            <th className={`${styles.TransactionsTable__cellRight}`}>{t('amount')}</th>
                            {canManagerFinance && (
                                <th className={`${styles.TransactionsTable__cellRight} ${styles.TransactionsTable__cellLast}`}>{t('actions')}</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {groupedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={canManagerFinance ? 5 : 4} className={`${styles.TransactionsTable__cellCenter} ${styles.TransactionsTable__cellEmptyState}`}>
                                    {t('no_transactions_found') || 'No hay transacciones registradas.'}
                                </td>
                            </tr>
                        ) : (
                            groupedTransactions.map((group) => {
                                const groupKey = group[0].appointment_id 
                                    ? `g-appt-${group[0].appointment_id}` 
                                    : group[0].request_id 
                                        ? `g-req-${group[0].request_id}`
                                        : `g-tx-${group[0].id}`;
                                
                                return (
                                    <React.Fragment key={groupKey}>
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
                                        <tr className={`${styles.TransactionsTable__groupFooter}`}>
                                            <td colSpan={canManagerFinance ? 8 : 7} className={`${styles.TransactionsTable__groupTotal}`}>
                                                {t('group_total')}: ${group.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                                );
                            })
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

