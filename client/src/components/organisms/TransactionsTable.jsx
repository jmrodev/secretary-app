import React, { useMemo } from 'react';
import Card from '../atoms/Card';
import { formatTime } from '../../utils/dateUtils';

// Molecules
import TransactionRow from '../molecules/TransactionRow';

import './TransactionsTable.css';

/**
 * TransactionsTable Organism.
 * Orchestrates the display of financial transactions, handling grouping logic 
 * and providing actions for viewing, editing, and deleting ledger entries.
 */
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

    /**
     * Specialized date formatter for the ledger.
     */
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

    /**
     * Translates internal system descriptions for display.
     */
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

    /**
     * Groups consecutive transactions that belong to the same entity (e.g., fractional payments).
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
                                    {group.map((tx) => (
                                        <TransactionRow
                                            key={tx.id}
                                            tx={tx}
                                            groupLength={group.length}
                                            canManagerFinance={canManagerFinance}
                                            formatDateUnambiguous={formatDateUnambiguous}
                                            formatTime={formatTime}
                                            translateDescription={translateDescription}
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
        </Card>
    );
};

export default TransactionsTable;
