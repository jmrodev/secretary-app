import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Badge from '@/components/atoms/Badge';
import InvoiceDetailContent from '@/features/finances/components/sections/InvoiceDetailContent';
import styles from './TransactionsTable.module.css';

/**
 * TransactionRow Feature Molecule.
 * Renders a specialized row for the financial ledger in the finances domain.
 * Refactored to follow BEM and Atomic Design standards.
 */
const TransactionRow = ({
    tx,
    groupLength,
    canManagerFinance,
    formatDateUnambiguous,
    formatTime,
    translateDescription,
    highlightPatientName,
    onGenerateInvoice,
    onEdit,
    onDelete,
    onSync,
    alert,
    t
}) => {
    const isWithdrawal = Boolean(tx.is_withdrawal) || tx.type === 'withdrawal' || tx.type === 'expense_withdrawal';
    const isPending = tx.status === 'pending' || tx.payment_status === 'pending';
    const isIncome = !isWithdrawal && !isPending && (
        tx.type === 'income' || 
        tx.type.includes('income') || 
        tx.type === 'appointment' || 
        tx.type === 'request' || 
        Boolean(tx.appointment_id) || 
        Boolean(tx.request_type) || 
        Number(tx.amount) > 0
    );

    const isGrouped = groupLength > 1;

    // Row color class logic: Pending takes precedence over income to highlight unpaid items in red
    const rowColorClass = isPending
        ? styles.rowPending
        : (isWithdrawal
            ? styles.rowWithdrawal
            : (isIncome ? styles.rowIncome : styles.rowExpense));

    // Normalizing status for Badge atom
    const getStatusVariant = (status, bonified) => {
        if (bonified === 1 || status === 'bonified') return 'blue';
        if (status === 'paid' || status === 'completed') return 'success';
        if (status === 'pending') return 'warning';
        if (status === 'rejected' || status === 'cancelled') return 'danger';
        return 'default';
    };

    return (
        <tr className={`transactions-table__row ${rowColorClass} ${isGrouped ? 'transactions-table__row--grouped' : ''} animate-fade-in`}>
            <td className="transactions-table__cell--first">
                <div className="transactions-table__date">{formatDateUnambiguous(tx.transaction_date)}</div>
                <div className="transactions-table__time">{formatTime(tx.transaction_date)}</div>
            </td>
            <td>
                <div className="transactions-table__description-wrapper">
                    <Badge 
                        variant={isIncome ? 'success' : 'rejected'} 
                        className="transactions-table__type-tag"
                        size="sm"
                    >
                        {tx.appointment_id
                            ? (t('appointment') || 'Turno')
                            : tx.request_type
                                ? (t(tx.request_type) || tx.request_type)
                                : (t(tx.type) || tx.type.replace('_', ' '))
                        }
                    </Badge>
                    <span className="transactions-table__description">
                        {highlightPatientName(translateDescription(tx.description), tx.patient_full_name)}
                    </span>
                </div>
            </td>
            <td>
                <div className="transactions-table__beneficiary">
                    <span className="transactions-table__beneficiary-name">
                        {tx.patient_full_name ? (
                            <>
                                <Icon name="PROFILE" size="1.2rem" className="transactions-table__beneficiary-icon" />
                                {tx.patient_full_name}
                            </>
                        ) : (tx.doctor_name || t('general_clinic'))}
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
                <Badge variant={getStatusVariant(tx.status, tx.bonified)}>
                    {(tx.bonified === 1 || tx.payment_status === 'bonified') ? (t('bonified') || 'Bonificado') : t(tx.status)}
                </Badge>
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
                            onClick={() => alert(<InvoiceDetailContent tx={tx} formatDate={formatDateUnambiguous} />)}
                            title={t('view_details')}
                            icon={<Icon name="VIEW" size="1.1rem" />}
                        >
                            {t('view_action')}
                        </Button>
                    </div>
                ) : tx.proof_file ? (
                    <a href={tx.proof_file} target="_blank" rel="noreferrer" className="transactions-table__proof-link" title={t('view')}>
                        <Icon name="DOCUMENTS" size="1.2rem" />
                    </a>
                ) : <span className="transactions-table__no-proof">-</span>}
            </td>
            {canManagerFinance && (
                <td className="transactions-table__cell--right transactions-table__cell--last">
                    <div className="transactions-table__actions">
                        {tx.type === 'income_patient' && tx.status === 'paid' && !tx.invoice_number && (
                            <Button size="sm-compact" variant="ghost" onClick={() => onGenerateInvoice(tx.id)} title={t('generate_invoice')} icon={<Icon name="REPORTS" />} />
                        )}
                        {tx.status === 'pending' && (
                            <Button size="sm-compact" variant="ghost" onClick={() => onEdit({ ...tx, status: 'paid' })} title={t('pay')} icon={<Icon name="FINANCES" />} />
                        )}
                        <Button size="sm-compact" variant="ghost" onClick={() => onEdit(tx)} title={t('edit')} icon={<Icon name="EDIT" />} />
                        {tx.status === 'paid' && (
                            <Button size="sm-compact" variant="ghost" onClick={() => onSync(tx.id)} title={t('sync_google')} icon={<Icon name="SYNC" />} />
                        )}
                        <Button size="sm-compact" variant="ghost" onClick={() => onDelete(tx.id)} title={t('delete')} icon={<Icon name="DELETE" />} />
                    </div>
                </td>
            )}
        </tr>
    );
};

export default TransactionRow;


