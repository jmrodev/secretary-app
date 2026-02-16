import React from 'react';
import Card from '../atoms/Card';
import './FinanceStatsCards.css';

const FinanceStatsCards = ({ stats, t }) => {
    // Separate different types of stats
    const paymentMethods = stats.filter(s => ['cash', 'transfer', 'withdrawal'].includes(s.type));
    const financialSummary = stats.filter(s => s.type === 'net_cash'); // Only net_cash, debts are shown in other cards
    const otherStats = stats.filter(s => !['cash', 'transfer', 'withdrawal', 'debts', 'net_cash', 'pending_debt'].includes(s.type));

    return (
        <div className="finance-stats">
            {/* Other Stats Cards (Appointments, Prescriptions) */}
            {otherStats.map((s, idx) => (
                <Card key={idx} className="finance-stats__card">
                    <span className="finance-stats__title">
                        {t(s.type) || s.label || s.type}
                    </span>

                    {s.type === 'appointments' || s.type === 'prescriptions' ? (
                        /* Turnos/Recetas - Advanced breakdown */
                        <div className="finance-stats__breakdown">
                            <table className="finance-stats__table">
                                <thead>
                                    <tr>
                                        <th className="finance-stats__table-header">{t('period')}</th>
                                        <th className="finance-stats__table-header text-right">
                                            {s.type === 'appointments' ? t('appointments') : t('prescriptions')}
                                        </th>
                                        <th className="finance-stats__table-header text-right">{t('payment')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { l: 'this_day', d: s.today, c: 'finance-stats__value--purple' },
                                        { l: 'this_week', d: s.week, c: 'finance-stats__value--purple' },
                                        { l: 'this_month', d: s.month, c: 'finance-stats__value--gray' },
                                        { l: 'this_year', d: s.year, c: 'finance-stats__value--muted' }
                                    ].map(row => (
                                        <tr key={row.l}>
                                            <td className="finance-stats__table-cell finance-stats__label">{t(row.l)}</td>
                                            <td className={`finance-stats__table-cell text-right font-bold ${row.c}`}>
                                                {row.d?.count || 0}
                                            </td>
                                            <td className="finance-stats__table-cell text-right font-bold finance-stats__value--green">
                                                ${Number(row.d?.paid || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="finance-stats__row finance-stats__row--divider">
                                <span className="finance-stats__label font-bold">{t('debt')}</span>
                                <span className={`finance-stats__value ${s.debt > 0 ? 'finance-stats__value--red' : 'finance-stats__value--muted'}`}>
                                    ${Number(s.debt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ) : null}
                </Card>
            ))}

            {/* Combined Payment Methods Card with Financial Summary */}
            {(paymentMethods.length > 0 || financialSummary.length > 0) && (
                <Card className="finance-stats__card">
                    <span className="finance-stats__title">{t('payment_methods') || 'Métodos de Pago'}</span>
                    <div className="finance-stats__breakdown">
                        <table className="finance-stats__table">
                            <thead>
                                <tr>
                                    <th className="finance-stats__table-header">{t('method') || 'Método'}</th>
                                    <th className="finance-stats__table-header text-right">{t('this_day')}</th>
                                    <th className="finance-stats__table-header text-right">{t('this_month')}</th>
                                    <th className="finance-stats__table-header text-right">{t('this_year')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentMethods.map((s, idx) => (
                                    <tr key={idx}>
                                        <td className="finance-stats__table-cell finance-stats__label">
                                            {t(s.type) || s.label || s.type}
                                        </td>
                                        <td className="finance-stats__table-cell text-right font-bold finance-stats__value--blue">
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
                                {financialSummary.map((s, idx) => (
                                    <tr key={`summary-${idx}`} className="finance-stats__summary-row">
                                        <td className="finance-stats__table-cell finance-stats__label">
                                            {s.type === 'net_cash'
                                                ? (t('available_cash') || 'Efectivo Disponible')
                                                : s.type === 'debts'
                                                    ? (t('pending_debt') || 'Deuda Pendiente')
                                                    : (t(s.type) || s.label || s.type)
                                            }
                                        </td>
                                        {s.today !== undefined && typeof s.today !== 'object' ? (
                                            <>
                                                <td className="finance-stats__table-cell text-right font-bold finance-stats__value--blue">
                                                    ${Number(s.today).toLocaleString()}
                                                </td>
                                                <td className="finance-stats__table-cell text-right font-bold finance-stats__value--gray">
                                                    ${Number(s.month).toLocaleString()}
                                                </td>
                                                <td className="finance-stats__table-cell text-right font-bold finance-stats__value--muted">
                                                    ${Number(s.year).toLocaleString()}
                                                </td>
                                            </>
                                        ) : (
                                            <td colSpan="3" className="finance-stats__table-cell text-right font-bold finance-stats__value--red">
                                                ${Number(s.total || 0).toLocaleString()}
                                            </td>
                                        )}
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
