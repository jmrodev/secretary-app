import React from 'react';
import Card from '@/components/atoms/Card';
import Icon from '@/components/atoms/Icon';
import './FinanceStatsCards.css';

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
        <section className="finance-stats">
            <h2 className="visually-hidden">{t('financial_summary_title')}</h2>
            {/* Breakdown Cards (Appointments, Prescriptions, Licenses, Certificates) */}
            {otherStats.map((s, idx) => (
                <Card key={idx} className="finance-stats__card">
                    <h3 className="finance-stats__title">
                        <Icon 
                            name={typeIcons[s.type]} 
                            size="0.8rem" 
                            className={`finance-stats__icon finance-stats__icon--${s.type}`} 
                        />
                        {t(s.type) || s.type}
                    </h3>

                    <div className="finance-stats__breakdown">
                        <table className="finance-stats__table">
                            <thead>
                                <tr>
                                    <th className="finance-stats__table-header">{t('period_label')}</th>
                                    <th className="finance-stats__table-header finance-stats__table-header--right">
                                        {t('count_label')}
                                    </th>
                                    <th className="finance-stats__table-header finance-stats__table-header--right">{t('bonified_short') || 'Bonif.'}</th>
                                    <th className="finance-stats__table-header finance-stats__table-header--right">{t('payment')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { l: 'this_day', d: s.today, c: 'finance-stats__value--purple' },
                                    { l: 'this_month', d: s.month, c: 'finance-stats__value--gray' },
                                    { l: 'this_year', d: s.year, c: 'finance-stats__value--muted' }
                                ]
                                    .map(row => {
                                        const count = typeof row.d === 'object' ? (row.d?.count ?? 0) : 0;
                                        const paid = typeof row.d === 'object' ? (row.d?.paid ?? 0) : (row.d ?? 0);
                                        const bonified = typeof row.d === 'object' ? (row.d?.bonified ?? 0) : 0;

                                        return (
                                            <tr key={row.l}>
                                                <td className="finance-stats__table-cell finance-stats__label">{t(row.l) || row.l}</td>
                                                <td className={`finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--bold ${row.c}`}>
                                                    {Number(count).toLocaleString()}
                                                </td>
                                                <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--muted finance-stats__value--bold">
                                                    {Number(bonified).toLocaleString()}
                                                </td>
                                                <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--green finance-stats__value--bold">
                                                    ${Number(paid).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                        <div className="finance-stats__row finance-stats__row--divider">
                            <span className="finance-stats__label finance-stats__label--bold">{t('debt')}</span>
                            <span className={`finance-stats__value ${s.debt > 0 ? 'finance-stats__value--red' : 'finance-stats__value--muted'}`}>
                                ${Number(s.debt || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Combined Payment Methods Card with Financial Summary */}
            {(tableStats.length > 0 || financialSummary.length > 0) && (
                <Card className="finance-stats__card">
                    <h3 className="finance-stats__title">
                        <Icon name="payments" size="0.8rem" className="finance-stats__icon" />
                        {t('payment_methods_summary')}
                    </h3>
                    <div className="finance-stats__breakdown">
                        <table className="finance-stats__table">
                            <thead>
                                <tr>
                                    <th className="finance-stats__table-header">{t('concept_label')}</th>
                                    <th className="finance-stats__table-header finance-stats__table-header--right">{t('this_day')}</th>
                                    <th className="finance-stats__table-header finance-stats__table-header--right">{t('this_month')}</th>
                                    <th className="finance-stats__table-header finance-stats__table-header--right">{t('this_year')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableStats.map((s, idx) => {
                                    const isNegative = ['expenses', 'withdrawal'].includes(s.type);
                                    return (
                                        <tr key={idx} className="finance-stats__method-row">
                                            <td className="finance-stats__table-cell finance-stats__label">
                                                <Icon 
                                                    name={typeIcons[s.type]} 
                                                    size="0.7rem" 
                                                    className={`finance-stats__icon finance-stats__icon--${s.type}`} 
                                                />
                                                {(t(s.type) || s.type).toUpperCase()}
                                                {s.type === 'cash' ? ` (${t('concept_income')})` : ''}
                                                {s.type === 'transfer' ? ` (${t('concept_income')})` : ''}
                                            </td>
                                            <td className={`finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--bold ${isNegative ? 'finance-stats__value--red' : 'finance-stats__value--blue'}`}>
                                                {isNegative ? '-' : '+'}${Number(s.today).toLocaleString()}
                                            </td>
                                            <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--gray finance-stats__value--bold">
                                                ${Number(s.month).toLocaleString()}
                                            </td>
                                            <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--muted finance-stats__value--bold">
                                                ${Number(s.year).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {financialSummary.map((s, idx) => (
                                    <tr key={`summary-${idx}`} className="finance-stats__summary-row">
                                        <td className="finance-stats__table-cell finance-stats__label finance-stats__label--bold">
                                            <Icon 
                                                name={typeIcons[s.type]} 
                                                size="0.75rem" 
                                                className={`finance-stats__icon finance-stats__icon--${s.type}`} 
                                            />
                                            = {(t(s.type) || s.type).toUpperCase()}
                                        </td>
                                        <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--purple finance-stats__value--bold">
                                            ${Number(s.today).toLocaleString()}
                                        </td>
                                        <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--gray finance-stats__value--bold">
                                            ${Number(s.month).toLocaleString()}
                                        </td>
                                        <td className="finance-stats__table-cell finance-stats__table-cell--right finance-stats__value--muted finance-stats__value--bold">
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

