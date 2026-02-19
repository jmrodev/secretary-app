import React from 'react';
import Card from '../atoms/Card';
import Icon from '../atoms/Icon';
import './FinanceStatsCards.css';

const FinanceStatsCards = ({ stats, t }) => {
    // Separate different types of stats
    const tableStats = stats.filter(s => ['cash', 'transfer', 'withdrawal', 'expenses'].includes(s.type));
    const financialSummary = stats.filter(s => s.type === 'net_cash');

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
        pending_debt: 'warning'
    };

    // Color mapping for icons to maintain rich aesthetics
    const typeColors = {
        cash: 'var(--green-600)',
        transfer: 'var(--blue-600)',
        withdrawal: 'var(--orange-600)',
        expenses: 'var(--red-600)',
        appointments: 'var(--indigo-600)',
        prescriptions: 'var(--pink-600)',
        licenses: 'var(--sky-600)',
        certificates: 'var(--amber-600)',
        net_cash: 'var(--yellow-600)',
        pending_debt: 'var(--error)'
    };

    return (
        <div className="finance-stats">
            {/* Breakdown Cards (Appointments, Prescriptions, Licenses, Certificates) */}
            {otherStats.map((s, idx) => (
                <Card key={idx} className="finance-stats__card">
                    <span className="finance-stats__title">
                        <Icon name={typeIcons[s.type]} size="0.8rem" color={typeColors[s.type]} className="mr-1" />
                        {t(s.type) || s.type}
                    </span>

                    <div className="finance-stats__breakdown">
                        <table className="finance-stats__table">
                            <thead>
                                <tr>
                                    <th className="finance-stats__table-header">{t('period') || 'Período'}</th>
                                    <th className="finance-stats__table-header text-right">
                                        {t('count') || 'Cant.'}
                                    </th>
                                    <th className="finance-stats__table-header text-right">{t('payment') || 'Pago'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { l: 'this_day', d: s.today, c: 'finance-stats__value--purple' },
                                    { l: 'this_month', d: s.month, c: 'finance-stats__value--gray' },
                                    { l: 'this_year', d: s.year, c: 'finance-stats__value--muted' }
                                ]
                                    .map(row => {
                                        // Safety check: row.d can be an object {count, paid} or a number (legacy/flat)
                                        const count = typeof row.d === 'object' ? (row.d?.count ?? 0) : 0;
                                        const paid = typeof row.d === 'object' ? (row.d?.paid ?? 0) : (row.d ?? 0);

                                        return (
                                            <tr key={row.l}>
                                                <td className="finance-stats__table-cell finance-stats__label">{t(row.l) || row.l}</td>
                                                <td className={`finance-stats__table-cell text-right font-bold ${row.c}`}>
                                                    {Number(count).toLocaleString()}
                                                </td>
                                                <td className="finance-stats__table-cell text-right font-bold finance-stats__value--green">
                                                    ${Number(paid).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                        <div className="finance-stats__row finance-stats__row--divider">
                            <span className="finance-stats__label font-bold">{t('debt') || 'Deuda'}</span>
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
                    <span className="finance-stats__title">
                        <Icon name="payments" size="0.8rem" className="mr-1" />
                        {t('payment_methods') || 'MÉTODOS DE PAGO / GASTOS'}
                    </span>
                    <div className="finance-stats__breakdown">
                        <table className="finance-stats__table">
                            <thead>
                                <tr>
                                    <th className="finance-stats__table-header">{t('concept') || 'CONCEPTO'}</th>
                                    <th className="finance-stats__table-header text-right">{t('this_day') || 'HOY'}</th>
                                    <th className="finance-stats__table-header text-right">{t('this_month') || 'ESTE MES'}</th>
                                    <th className="finance-stats__table-header text-right">{t('this_year') || 'ESTE AÑO'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableStats.map((s, idx) => {
                                    const isNegative = ['expenses', 'withdrawal'].includes(s.type);
                                    return (
                                        <tr key={idx} className="finance-stats__method-row">
                                            <td className="finance-stats__table-cell finance-stats__label">
                                                <Icon name={typeIcons[s.type]} size="0.7rem" color={typeColors[s.type]} className="mr-1" />
                                                {(t(s.type) || s.type).toUpperCase()}
                                                {s.type === 'cash' ? ` (${t('concept_income') || 'Ingreso'})` : ''}
                                                {s.type === 'transfer' ? ` (${t('concept_income') || 'Ingreso'})` : ''}
                                            </td>
                                            <td className={`finance-stats__table-cell text-right font-bold ${isNegative ? 'finance-stats__value--red' : 'finance-stats__value--blue'}`}>
                                                {isNegative ? '-' : '+'}${Number(s.today).toLocaleString()}
                                            </td>
                                            <td className="finance-stats__table-cell text-right font-bold finance-stats__value--gray">
                                                ${Number(s.month).toLocaleString()}
                                            </td>
                                            <td className="finance-stats__table-cell text-right font-bold finance-stats__value--muted">
                                                ${Number(s.year).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {financialSummary.map((s, idx) => (
                                    <tr key={`summary-${idx}`} className="finance-stats__summary-row">
                                        <td className="finance-stats__table-cell finance-stats__label font-bold">
                                            <Icon name={typeIcons[s.type]} size="0.75rem" color={typeColors[s.type]} className="mr-1" />
                                            = {(t(s.type) || s.type).toUpperCase()}
                                        </td>
                                        <td className="finance-stats__table-cell text-right font-bold finance-stats__value--purple">
                                            ${Number(s.today).toLocaleString()}
                                        </td>
                                        <td className="finance-stats__table-cell text-right font-bold finance-stats__value--gray">
                                            ${Number(s.month).toLocaleString()}
                                        </td>
                                        <td className="finance-stats__table-cell text-right font-bold finance-stats__value--muted">
                                            ${Number(s.year).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default FinanceStatsCards;
