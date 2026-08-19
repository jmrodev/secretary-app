import React from 'react';
import { getNow, parseDate } from '@/utils/core/dateUtils';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import styles from './InstitutionTransactionsTable.module.css';

/**
 * InstitutionTransactionsTable Molecule.
 * Renders the list of financial transactions for an institution.
 */
export const InstitutionTransactionsTable = ({
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
    // Use a stable reference for "today" to avoid hydration issues and unnecessary recalculations
    const [today] = React.useState(() => getNow());
    const pendingTransactions = transactions.filter(tr => tr.payment_status === 'pending');
    const allChecked = pendingTransactions.length > 0 && pendingTransactions.every(tr => selectedTrs.has(tr.transaction_id));

    return (
        <section className={`${styles.InstitutionTransactionsTable__root}`}>
            <header className={`${styles.InstitutionTransactionsTable__header}`}>
                <h3 className={`${styles.InstitutionTransactionsTable__title}`}>
                    <Icon name="REQUESTS" size="1.2rem" /> {t('transaction_log')}
                    <span className={`${styles.InstitutionTransactionsTable__badge}`}>{transactions.length}</span>
                </h3>
                <div className={`${styles.InstitutionTransactionsTable__actions}`}>
                    <div className={`${styles.InstitutionTransactionsTable__viewToggle}`}>
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

            <div className={`${styles.InstitutionTransactionsTable__wrapper}`}>
                <table className={`${styles.InstitutionTransactionsTable__table}`}>
                    <thead>
                        <tr>
                            <th className={`${styles.InstitutionTransactionsTable__cellCenter}`}>
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    aria-label={t('select_all') || 'Select all'}
                                />
                            </th>
                            <th>{t('date_label')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('doctor')}</th>
                            <th className={`${styles.InstitutionTransactionsTable__cellCenter}`}>{t('status')}</th>
                            <th className={`${styles.InstitutionTransactionsTable__cellCenter}`}>{t('antiquity')}</th>
                            <th className={`${styles.InstitutionTransactionsTable__cellRight}`}>{t('amount')}</th>
                            <th className={`${styles.InstitutionTransactionsTable__cellCenter}`}>{t('payment')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tr => {
                            const displayDate = tr.appointment_date || tr.transaction_date;
                            const trDate = parseDate(displayDate);
                            const diffDays = Math.ceil(Math.abs(today - trDate) / (1000 * 60 * 60 * 24));
                            const isPending = tr.payment_status === 'pending';
                            const isChecked = selectedTrs.has(tr.transaction_id);

                            return (
                                <tr
                                    key={tr.transaction_id}
                                    className={`
                                        ${isPending ? styles.InstitutionTransactionsTable__trPending : ''} 
                                        ${isChecked ? styles.InstitutionTransactionsTable__trSelected : ''}
                                    `.trim()}
                                >
                                    <td className={`${styles.InstitutionTransactionsTable__cellCenter}`}>
                                        {isPending && (
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => onToggleSelect(tr.transaction_id)}
                                                aria-label={t('select_transaction') || 'Select transaction'}
                                            />
                                        )}
                                    </td>
                                    <td>{formatDate(displayDate)}</td>
                                    <td>
                                        {tr.patient_name ? (
                                            <a href={`/patients?search=${encodeURIComponent(tr.patient_name)}`} className={`${styles.InstitutionTransactionsTable__patientLink}`}>
                                                {tr.patient_name}
                                            </a>
                                        ) : (
                                            <span className={`${styles.InstitutionTransactionsTable__textMuted}`}>-</span>
                                        )}
                                    </td>
                                    <td>{tr.doctor_name || 'N/A'}</td>
                                    <td className={`${styles.InstitutionTransactionsTable__cellCenter}`}>
                                        <Badge variant={tr.appointment_status === 'completed' ? 'green' : 'gray'}>
                                            {t(tr.appointment_status) || tr.appointment_status}
                                        </Badge>
                                    </td>
                                    <td className={`${styles.InstitutionTransactionsTable__cellCenter}`} suppressHydrationWarning>
                                        {isPending ? (
                                            <span className={`${styles.InstitutionTransactionsTable__ageBadge} ${diffDays > 30 ? styles.InstitutionTransactionsTable__ageBadgeCritical : styles.InstitutionTransactionsTable__ageBadgeWarning}`}>
                                                {t('days_count').replace('{days}', diffDays)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className={`${styles.InstitutionTransactionsTable__cellRight} ${styles.InstitutionTransactionsTable__amountBold}`}>${Number(tr.amount).toLocaleString()}</td>
                                    <td className={`${styles.InstitutionTransactionsTable__cellCenter}`}>
                                        <Badge variant={tr.payment_status === 'paid' ? 'green' : 'red'}>
                                            {t(tr.payment_status)}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="8" className={`${styles.InstitutionTransactionsTable__empty}`}>
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

