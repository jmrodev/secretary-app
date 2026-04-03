import React from 'react';
import Badge from '../../../components/atoms/Badge';
import Icon from '../../../components/atoms/Icon';

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
        <div className="inst-table-container">
            <div className="inst-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="inst-table-title">
                    <Icon name="assignment" /> {t('transaction_log')}
                    <span className="inst-table-badge">{transactions.length}</span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="inst-finances__view-toggle">
                        <button
                            className={`inst-finances__toggle-btn ${showPendingOnly ? 'inst-finances__toggle-btn--active' : ''}`}
                            onClick={() => setShowPendingOnly(true)}
                        >
                            {t('only_debts')}
                        </button>
                        <button
                            className={`inst-finances__toggle-btn ${!showPendingOnly ? 'inst-finances__toggle-btn--active' : ''}`}
                            onClick={() => setShowPendingOnly(false)}
                        >
                            {t('all_transactions')}
                        </button>
                    </div>
                    <button
                        className="inst-finances__toggle-btn"
                        onClick={onPayClick}
                        style={{ background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                        <Icon name="payments" size="1rem" /> {t('pay')}
                    </button>
                </div>
            </div>

            <div className="inst-table-wrapper">
                <table className="inst-data-table">
                    <thead>
                        <tr>
                            <th align="center" style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={allChecked}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                    style={{ cursor: 'pointer' }}
                                />
                            </th>
                            <th>{t('date_label')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('doctor')}</th>
                            <th align="center">{t('status')}</th>
                            <th align="center">{t('antiquity')}</th>
                            <th align="right">{t('amount')}</th>
                            <th align="center">{t('payment')}</th>
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
                                    className={`${isPending ? 'inst-data-table__tr--pending' : ''} ${isChecked ? 'inst-data-table__tr--selected' : ''}`}
                                >
                                    <td align="center">
                                        {isPending && (
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => onToggleSelect(tr.transaction_id)}
                                                style={{ cursor: 'pointer' }}
                                            />
                                        )}
                                    </td>
                                    <td>{formatDate(displayDate)}</td>
                                    <td>
                                        {tr.patient_name ? (
                                            <a href={`/patients?search=${encodeURIComponent(tr.patient_name)}`} className="inst-patient-link">
                                                {tr.patient_name}
                                            </a>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td>{tr.doctor_name || 'N/A'}</td>
                                    <td align="center">
                                        <Badge variant={tr.appointment_status === 'completed' ? 'green' : 'gray'}>
                                            {t(tr.appointment_status) || tr.appointment_status}
                                        </Badge>
                                    </td>
                                    <td align="center">
                                        {isPending ? (
                                            <span className={`inst-age-badge ${diffDays > 30 ? 'inst-age-badge--critical' : 'inst-age-badge--warning'}`}>
                                                {t('days_count').replace('{days}', diffDays)}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td align="right" className="inst-data-table__amount-bold">${tr.amount}</td>
                                    <td align="center">
                                        <Badge variant={tr.payment_status === 'paid' ? 'green' : 'red'}>
                                            {t(tr.payment_status)}
                                        </Badge>
                                    </td>
                                </tr>
                            );
                        })}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan="8" className="inst-data-table__empty">
                                    {showPendingOnly ? t('no_debts_found') : t('no_movements_found')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InstitutionTransactionsTable;
