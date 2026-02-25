import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import InvoiceDetailContent from './InvoiceDetailContent';

/**
 * TransactionRow Molecule.
 * Renders a single row in the TransactionsTable.
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
    const isIncome = tx.type.includes('income') && !tx.is_withdrawal;
    const isGrouped = groupLength > 1;

    return (
        <tr className={isGrouped ? 'transactions-table__row--grouped' : ''}>
            <td className="pl-6-bem">
                <div className="transactions-table__date">{formatDateUnambiguous(tx.transaction_date)}</div>
                <div className="transactions-table__time">{formatTime(tx.transaction_date)}</div>
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
                                <Icon name="PROFILE" size="1.2rem" color="var(--blue-600)" />
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
                <span className={`status-badge-mini status-${tx.status}`}>
                    {t(tx.status)}
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
                            onClick={() => alert(<InvoiceDetailContent tx={tx} formatDate={formatDateUnambiguous} />)}
                            title={t('view_details')}
                            icon={<Icon name="VIEW" size="1.1rem" />}
                        >
                            {t('view_action')}
                        </Button>
                    </div>
                ) : tx.proof_file ? (
                    <a href={tx.proof_file} target="_blank" rel="noreferrer" className="btn-text" title={t('view')}>
                        <Icon name="DOCUMENTS" />
                    </a>
                ) : <span className="transactions-table__no-proof">-</span>}
            </td>
            {canManagerFinance && (
                <td className="transactions-table__cell--right pr-6-bem">
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
