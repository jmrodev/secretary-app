import React from 'react';
import Card from '../atoms/Card';
import './FinanceStatsCards.css';

const FinanceStatsCards = ({ stats, t }) => {
    // Separate different types of stats
    const tableStats = stats.filter(s => ['cash', 'transfer', 'withdrawal', 'expenses'].includes(s.type));
    const financialSummary = stats.filter(s => s.type === 'net_cash');

    // Medical request categories that use the breakdown table
    const breakdownTypes = ['appointments', 'prescriptions', 'licenses', 'certificates'];
    const otherStats = stats.filter(s => breakdownTypes.includes(s.type));

    // Icon and label mapping for better identification
    const typeIcons = {
        cash: '💵',
        transfer: '🏦',
        withdrawal: '📤',
        expenses: '📉',
        appointments: '🗓️',
        prescriptions: '💊',
        licenses: '📄',
        certificates: '📜',
        net_cash: '💰',
        pending_debt: '⚠️'
    };

    return (
        <div className="finance-stats">
            {/* Breakdown Cards (Appointments, Prescriptions, Licenses, Certificates) */}
            {otherStats.map((s, idx) => (
                <Card key={idx} className="finance-stats__card">
                    <span className="finance-stats__title">
                        {typeIcons[s.type] || ''} {t(s.type) || s.type}
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
                                    { l: 'this_day', d: { count: s.today?.count || 0, paid: s.today?.paid || s.today || 0 }, c: 'finance-stats__value--purple' },
                                    { l: 'this_month', d: { count: s.month?.count || 0, paid: s.month?.paid || s.month || 0 }, c: 'finance-stats__value--gray' },
                                    { l: 'this_year', d: { count: s.year?.count || 0, paid: s.year?.paid || s.year || 0 }, c: 'finance-stats__value--muted' }
                                ]
                                    .map(row => (
                                        <tr key={row.l}>
                                            <td className="finance-stats__table-cell finance-stats__label">{t(row.l) || row.l}</td>
                                            <td className={`finance-stats__table-cell text-right font-bold ${row.c}`}>
                                                {Number(row.d.count || 0).toLocaleString()}
                                            </td>
                                            <td className="finance-stats__table-cell text-right font-bold finance-stats__value--green">
                                                ${Number(row.d.paid || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
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
                    <span className="finance-stats__title">{t('payment_methods') || 'MÉTODOS DE PAGO / GASTOS'}</span>
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
                                        <tr key={idx}>
                                            <td className="finance-stats__table-cell finance-stats__label">
                                                {typeIcons[s.type] || ''} {(t(s.type) || s.type).toUpperCase()}
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
                                            {typeIcons[s.type] || ''} = {(t(s.type) || s.type).toUpperCase()}
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
