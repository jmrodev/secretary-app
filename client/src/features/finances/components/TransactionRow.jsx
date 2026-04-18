import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
<<<<<<< HEAD
import InvoiceDetailContent from './InvoiceDetailContent';
import './TransactionRow.css';
=======
import Badge from '@/components/atoms/Badge';
import InvoiceDetailContent from '@/features/finances/components/InvoiceDetailContent';
>>>>>>> main

/**
 * TransactionRow Feature Molecule.
 * Renders a specialized row for the financial ledger in the finances domain.
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

    // Normalizing status for Badge atom
    const getStatusVariant = (status, bonified) => {
        if (bonified === 1 || status === 'bonified') return 'blue';
        if (status === 'paid' || status === 'completed') return 'success';
        if (status === 'pending') return 'warning';
        if (status === 'rejected' || status === 'cancelled') return 'danger';
        return 'default';
    };

    return (
        <tr className={`transaction-row ${isGrouped ? 'transaction-row--grouped' : ''} animate-fadeIn`}>
            <td className="transaction-row__cell transaction-row__cell--first">
                <div className="transaction-row__date">{formatDateUnambiguous(tx.transaction_date)}</div>
                <div className="transaction-row__time">{formatTime(tx.transaction_date)}</div>
            </td>
            <td className="transaction-row__cell">
                <div className="transaction-row__description-wrapper">
                    <Badge 
                        variant={isIncome ? 'success' : 'rejected'} 
                        className="transaction-row__type-tag"
                        size="sm"
                    >
                        {tx.appointment_id
                            ? (t('appointment') || 'Turno')
                            : tx.request_type
                                ? (t(tx.request_type) || tx.request_type)
                                : (t(tx.type) || tx.type.replace('_', ' '))
                        }
                    </Badge>
                    <span className="transaction-row__description">
                        {highlightPatientName(translateDescription(tx.description), tx.patient_full_name)}
                    </span>
                </div>
            </td>
            <td className="transaction-row__cell">
                <div className="transaction-row__beneficiary">
                    <span className="transaction-row__beneficiary-name">
                        {tx.patient_full_name ? (
                            <>
                                <Icon name="PROFILE" size="1.2rem" className="transaction-row__beneficiary-icon" />
                                {tx.patient_full_name}
                            </>
                        ) : (tx.doctor_name || t('general_clinic'))}
                    </span>
                    {tx.patient_full_name && tx.doctor_name && (
                        <span className="transaction-row__patient">
                            {tx.doctor_name}
                        </span>
                    )}
                </div>
            </td>
            <td className="transaction-row__cell">
                <div className="transaction-row__method">
                    <span>{t(tx.method) || tx.method}</span>
                </div>
            </td>
            <td className="transaction-row__cell">
                <Badge variant={getStatusVariant(tx.status, tx.bonified)}>
                    {(tx.bonified === 1 || tx.payment_status === 'bonified') ? (t('bonified') || 'Bonificado') : t(tx.status)}
                </Badge>
            </td>
            <td className={`transaction-row__cell transaction-row__amount ${tx.is_withdrawal ? 'transaction-row__amount--withdrawal' : (isIncome ? 'transaction-row__amount--income' : 'transaction-row__amount--expense')}`}>
                {tx.is_withdrawal ? '↩' : (isIncome ? '+' : '-')}${Math.abs(tx.amount).toLocaleString()}
            </td>
            <td className="transaction-row__cell transaction-row__cell--center">
                {tx.invoice_number ? (
                    <div className="transaction-row__invoice-info">
                        <span className="transaction-row__invoice-number">
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
                    <a href={tx.proof_file} target="_blank" rel="noreferrer" className="transaction-row__proof-link" title={t('view')}>
                        <Icon name="DOCUMENTS" size="1.2rem" />
                    </a>
                ) : <span className="transaction-row__no-proof">-</span>}
            </td>
            {canManagerFinance && (
                <td className="transaction-row__cell transaction-row__cell--right transaction-row__cell--last">
                    <div className="transaction-row__actions">
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


