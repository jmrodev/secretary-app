import React from 'react';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import './InstitutionTransactionsTable.css';

/**
 * InstitutionTransactionsTable Molecule.
 * Renders the list of financial transactions for an institution.
 */
const InstitutionTransactionsTable = ({
    transactions,
    showPendingOnly,
    setShowPendingOnly,
    selectedTrs,
    onToggleSelect,
    onSelectAll,
    onPayClick,
    formatDate,
    t
}) => {
    const pendingTransactions = transactions.filter(tr => tr.payment_status === 'pending');
    const allChecked = pendingTransactions.length > 0 && pendingTransactions.every(tr => selectedTrs.has(tr.transaction_id));

    return (
        <section className="institution-transactions">
            <header className="institution-transactions__header">
                <h3 className="institution-transactions__title">
                    <Icon name="REQUESTS" size="1.2rem" /> {t('transaction_log')}
                    <span className="institution-transactions__badge">{transactions.length}</span>
                </h3>
                <div className="institution-transactions__actions">
                    <div className="institution-transactions__view-toggle">
                        <Button
                            variant={showPendingOnly ? 'primary' : 'ghost'}
                            size="sm-compact"
                            onClick={() => setShowPendingOnly(true)}
                        >
                            {t('only_debts')}
                        </Button>
                        <Button
                            variant={!showPendingOnly ? 'primary' : 'ghost'}
                            size="sm-compact"
                            onClick={() => setShowPendingOnly(false)}
                        >
                            {t('all_transactions')}
                        </Button>
                    </div>
                    <Button
                        variant="primary"
                        size="sm-compact"
                        onClick={onPayClick}
                        icon={<Icon name="FINANCES" size="1rem" />}
                        disabled={selectedTrs.size === 0}
                    >
                        {t('pay')}
                    </Button>
                </div>
            </header>

            <div className="institution-transactions__wrapper">
                <table className="institution-transactions__table">
                    <thead>
                        <tr>
                            <th className="institution-transactions__cell--center">
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                />
                            </th>
                            <th>{t('date_label')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('doctor')}</th>
                            <th className="institution-transactions__cell--center">{t('status')}</th>
                            <th className="institution-transactions__cell--center">{t('antiquity')}</th>
                            <th className="institution-transactions__cell--right">{t('amount')}</th>
                            <th className="institution-transactions__cell--center">{t('payment')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tr => {
                            const displayDate = tr.appointment_date || tr.transaction_date;
                            const trDate = new Date(displayDate);
                            const diffDays = Math.ceil(Math.abs(new Date() - trDate) / (1000 * 60 * 60 * 24));
                            const isPending = tr.payment_status === 'pending';
                            const isChecked = selectedTrs.has(tr.transaction_id);

                            return (
                                <tr
                                    key={tr.transaction_id}
                                    className={`
                                        ${isPending ? 'institution-transactions__tr--pending' : ''} 
                                        ${isChecked ? 'institution-transactions__tr--selected' : ''}
                                    `.trim()}
                                >
                                    <td className="institution-transactions__cell--center">
                                        {isPending && (
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => onToggleSelect(tr.transaction_id)}
                                            />
                                        )}
                                    </td>
                                    <td>{formatDate(displayDate)}</td>
                                    <td>
                                        {tr.patient_name ? (
                                            <a href={`/patients?search=${encodeURIComponent(tr.patient_name)}`} className="institution-transactions__patient-link">
                                                {tr.patient_name}
                                            </a>
                                        ) : (
                                            <span className="institution-transactions__text-muted">—</span>
                                        )}
                                    </td>
                                    <td>{tr.doctor_name || 'N/A'}</td>
                                    <td className="institution-transactions__cell--center">
                                        <Badge variant={tr.appointment_status === 'completed' ? 'green' : 'gray'}>
                                            {t(tr.appointment_status) || tr.appointment_status}
                                        </Badge>
                                    </td>
                                    <td className="institution-transactions__cell--center">
                                        {isPending ? (
                                            <span className={`institution-transactions__age-badge ${diffDays > 30 ? 'institution-transactions__age-badge--critical' : 'institution-transactions__age-badge--warning'}`}>
                                                {t('days_count').replace('{days}', diffDays)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="institution-transactions__cell--right institution-transactions__amount-bold">${Number(tr.amount).toLocaleString()}</td>
                                    <td className="institution-transactions__cell--center">
                                        <Badge variant={tr.payment_status === 'paid' ? 'green' : 'red'}>
                                            {t(tr.payment_status)}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="8" className="institution-transactions__empty">
                                    {showPendingOnly ? t('no_debts_found') : t('no_movements_found')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default InstitutionTransactionsTable;

