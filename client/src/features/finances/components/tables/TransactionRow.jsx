import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import styles from './TransactionsTable.module.css';

/**
 * TransactionRow Feature Molecule.
 * Renders a specialized row for the financial ledger in the finances domain.
 * Refactored to follow BEM and Atomic Design standards.
 */
export const TransactionRow = ({
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
    alert: showDetail,
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
                        {(() => {
                            if (tx.is_withdrawal || tx.type === 'withdrawal') return t('withdrawal') || 'Retiro';
                            if (tx.request_type) return t(tx.request_type) || tx.request_type;
                            if (tx.service_type) return t(tx.service_type) || tx.service_type;
                            if (tx.type === 'income_rental') return t('rental') || 'Alquiler';
                            if (tx.appointment_id) return t('appointment') || 'Turno';
                            return t(tx.type) || tx.type.replace('_', ' ');
                        })()}
                    </Badge>
                    <span className="transactions-table__description">
                        {(() => {
                            let cleanDesc = translateDescription(tx.description) || '';
                            // Remove redundant prefixes matching the badge tag
                            cleanDesc = cleanDesc.replace(/^(Turno|Retiro|Consulta|Solicitud)\s*[-:]\s*/i, '');
                            return highlightPatientName(cleanDesc, tx.patient_full_name);
                        })()}
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
            <td className={`transactions-table__amount ${tx.is_withdrawal ? 'transactions-table__amount--withdrawal' : (isIncome ? 'transactions-table__amount--income' : 'transactions-table__amount--expense')}`}>
                {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
            </td>
            {canManagerFinance && (
                <td className="transactions-table__cell--right transactions-table__cell--last">
                    <div className={styles.TransactionsTable__actions}>
                        <Button 
                            size="sm-compact" 
                            variant="action-view" 
                            onClick={() => onEdit({ ...tx, _isDirectEdit: false })}
                            title={t('view_details')} 
                            icon={<Icon name="visibility" size="1rem" />} 
                        />
                        {tx.type === 'income_patient' && tx.status === 'paid' && !tx.invoice_number && (
                            <Button 
                                size="sm-compact" 
                                variant="action-invoice" 
                                onClick={() => onGenerateInvoice(tx.id)} 
                                title={t('generate_invoice')} 
                                icon={<Icon name="receipt" size="1rem" />} 
                            />
                        )}
                        {tx.status === 'pending' && (
                            <Button 
                                size="sm-compact" 
                                variant="action-pay" 
                                onClick={() => onEdit({ ...tx, status: 'paid', _isDirectEdit: true })} 
                                title={t('pay')} 
                                icon={<Icon name="payments" size="1rem" />} 
                            />
                        )}
                        <Button 
                            size="sm-compact" 
                            variant="action-view" 
                            onClick={() => onEdit({ ...tx, _isDirectEdit: false })} 
                            title={t('view')} 
                            icon={<Icon name="visibility" size="1rem" />} 
                        />
                        <Button 
                            size="sm-compact" 
                            variant="action-edit" 
                            onClick={() => onEdit({ ...tx, _isDirectEdit: true })} 
                            title={t('edit')} 
                            icon={<Icon name="edit" size="1rem" />} 
                        />
                        {tx.status === 'paid' && (
                            <Button 
                                size="sm-compact" 
                                variant="action-sync" 
                                onClick={() => onSync(tx.id)} 
                                title={t('sync_google')} 
                                icon={<Icon name="sync" size="1rem" />} 
                            />
                        )}
                        <Button 
                            size="sm-compact" 
                            variant="action-delete" 
                            onClick={() => onDelete(tx.id)} 
                            title={t('delete')} 
                            icon={<Icon name="delete" size="1rem" />} 
                        />
                    </div>
                </td>
            )}
        </tr>
    );
};

