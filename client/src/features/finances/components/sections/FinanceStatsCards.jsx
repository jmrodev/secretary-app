import React from 'react';
import Card from '@/components/atoms/Card';
import Icon from '@/components/atoms/Icon';
import styles from './FinanceStatsCards.module.css';

/**
 * FinanceStatsCards Feature Organism.
 * Displays financial breakdown by category and payment methods.
 * Refactored to follow BEM and Atomic Design standards.
 */
const FinanceStatsCards = ({ stats, t }) => {
    // Separate different types of stats
    const tableStats = stats.filter(s => ['cash', 'transfer', 'withdrawal', 'expenses'].includes(s.type));
    const financialSummary = stats.filter(s => ['cash_balance', 'transfer_balance', 'total_net', 'net_cash'].includes(s.type));

    // Medical request categories that use the breakdown table
    const breakdownTypes = ['appointments', 'prescriptions', 'licenses', 'certificates'];
    const otherStats = stats.filter(s => breakdownTypes.includes(s.type));

    // Icon mapping using semantic names for the Icon atom
    const typeIcons = {
        cash: 'payments',
        transfer: 'account_balance',
        withdrawal: 'logout',
        expenses: 'trending_down',
        appointments: 'calendar_month',
        prescriptions: 'medication',
        licenses: 'badge',
        certificates: 'verified',
        net_cash: 'monetization_on',
        cash_balance: 'payments',
        transfer_balance: 'account_balance',
        total_net: 'account_balance_wallet',
        pending_debt: 'warning'
    };

    return (
        <section className={`${styles.root}`}>
            <h2 className="visually-hidden">{t('financial_summary_title')}</h2>
            {/* Breakdown Cards (Appointments, Prescriptions, Licenses, Certificates) */}
            {otherStats.map((s) => (
                <Card key={s.type} className={`${styles.card}`}>
                    <h3 className={`${styles.title}`}>
                        <Icon 
                            name={typeIcons[s.type]} 
                            size="0.8rem" 
                            className={`${styles.icon} finance-stats__icon--${s.type}`} 
                        />
                        {t(s.type) || s.type}
                    </h3>

                    <div className={`${styles.breakdown}`}>
                        <table className={`${styles.table}`}>
                            <thead>
                                <tr>
                                    <th className={`${styles.tableHeader}`}>{t('period_label')}</th>
                                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>
                                        {t('count_label')}
                                    </th>
                                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>{t('bonified_short') || 'Bonif.'}</th>
                                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>{t('payment')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { l: 'this_day', d: s.today, c: styles.valuePurple },
                                    { l: 'this_month', d: s.month, c: styles.valueGray },
                                    { l: 'this_year', d: s.year, c: styles.valueMuted }
                                ]
                                    .map(row => {
                                        const count = typeof row.d === 'object' ? (row.d?.count ?? 0) : 0;
                                        const paid = typeof row.d === 'object' ? (row.d?.paid ?? 0) : (row.d ?? 0);
                                        const bonified = typeof row.d === 'object' ? (row.d?.bonified ?? 0) : 0;

                                        return (
                                            <tr key={row.l}>
                                                <td className={`${styles.tableCell} ${styles.label}`}>{t(row.l) || row.l}</td>
                                                <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueBold} ${row.c}`}>
                                                    {Number(count).toLocaleString()}
                                                </td>
                                                <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueMuted} ${styles.valueBold}`}>
                                                    {Number(bonified).toLocaleString()}
                                                </td>
                                                <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueGreen} ${styles.valueBold}`}>
                                                    ${Number(paid).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                        <div className={`${styles.row} ${styles.rowDivider}`}>
                            <span className={`${styles.label} ${styles.labelBold}`}>{t('debt')}</span>
                            <span className={`${styles.value} ${s.debt > 0 ? styles.valueRed : styles.valueMuted}`}>
                                ${Number(s.debt || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Combined Payment Methods Card with Financial Summary */}
            {(tableStats.length > 0 || financialSummary.length > 0) && (
                <Card className={`${styles.card}`}>
                    <h3 className={`${styles.title}`}>
                        <Icon name="payments" size="0.8rem" className={`${styles.icon}`} />
                        {t('payment_methods_summary')}
                    </h3>
                    <div className={`${styles.breakdown}`}>
                        <table className={`${styles.table}`}>
                            <thead>
                                <tr>
                                    <th className={`${styles.tableHeader}`}>{t('concept_label')}</th>
                                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>{t('this_day')}</th>
                                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>{t('this_month')}</th>
                                    <th className={`${styles.tableHeader} ${styles.tableHeaderRight}`}>{t('this_year')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableStats.map((s) => {
                                    const isNegative = ['expenses', 'withdrawal'].includes(s.type);
                                    return (
                                        <tr key={s.type} className="finance-stats__method-row">
                                            <td className={`${styles.tableCell} ${styles.label}`}>
                                                <Icon 
                                                    name={typeIcons[s.type]} 
                                                    size="0.7rem" 
                                                    className={`${styles.icon} finance-stats__icon--${s.type}`} 
                                                />
                                                {(t(s.type) || s.type).toUpperCase()}
                                                {s.type === 'cash' ? ` (${t('concept_income')})` : ''}
                                                {s.type === 'transfer' ? ` (${t('concept_income')})` : ''}
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueBold} ${isNegative ? styles.valueRed : styles.valueBlue}`}>
                                                {isNegative ? '-' : '+'}${Number(s.today).toLocaleString()}
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueGray} ${styles.valueBold}`}>
                                                ${Number(s.month).toLocaleString()}
                                            </td>
                                            <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueMuted} ${styles.valueBold}`}>
                                                ${Number(s.year).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {financialSummary.map((s) => (
                                    <tr key={s.type} className={`${styles.summaryRow}`}>
                                        <td className={`${styles.tableCell} ${styles.label} ${styles.labelBold}`}>
                                            <Icon 
                                                name={typeIcons[s.type]} 
                                                size="0.75rem" 
                                                className={`${styles.icon} finance-stats__icon--${s.type}`} 
                                            />
                                            = {(t(s.type) || s.type).toUpperCase()}
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valuePurple} ${styles.valueBold}`}>
                                            ${Number(s.today).toLocaleString()}
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueGray} ${styles.valueBold}`}>
                                            ${Number(s.month).toLocaleString()}
                                        </td>
                                        <td className={`${styles.tableCell} ${styles.tableCellRight} ${styles.valueMuted} ${styles.valueBold}`}>
                                            ${Number(s.year).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </section>
    );
};

export default FinanceStatsCards;

