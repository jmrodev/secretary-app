import React from 'react';
import Card from '../atoms/Card';

const FinanceStatsCards = ({ stats, t }) => {
    return (
        <div className="finance-stats">
            {stats.map((s, idx) => (
                <Card key={idx} className="finance-stats__card">
                    <span className="finance-stats__title">
                        {t(s.type) || s.label || s.type}
                    </span>

                    {/* Standard Breakdown (Cash/Transfer/Withdrawal) */}
                    {s.today !== undefined && typeof s.today !== 'object' ? (
                        <div className="finance-stats__breakdown">
                            <div className="finance-stats__row">
                                <span className="finance-stats__label">{t('this_day')}</span>
                                <span className="finance-stats__value finance-stats__value--blue">
                                    ${Number(s.today).toLocaleString()}
                                </span>
                            </div>
                            <div className="finance-stats__row">
                                <span className="finance-stats__label">{t('this_month')}</span>
                                <span className="finance-stats__value finance-stats__value--gray">
                                    ${Number(s.month).toLocaleString()}
                                </span>
                            </div>
                            <div className="finance-stats__row">
                                <span className="finance-stats__label">{t('this_year')}</span>
                                <span className="finance-stats__value finance-stats__value--muted">
                                    ${Number(s.year).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ) : s.type === 'appointments' || s.type === 'prescriptions' ? (
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
                    ) : (
                        /* Total Debts */
                        <span className="finance-stats__value finance-stats__value--large finance-stats__value--red">
                            ${Number(s.total || 0).toLocaleString()}
                        </span>
                    )}
                </Card>
            ))}
        </div>
    );
};

export default FinanceStatsCards;
