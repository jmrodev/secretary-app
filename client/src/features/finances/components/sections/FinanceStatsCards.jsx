import React from 'react';
import { Card } from '@/components/atoms/Card';
import { Icon } from '@/components/atoms/Icon';
import styles from './FinanceStatsCards.module.css';

const breakdownTypes = ['appointments', 'prescriptions', 'licenses', 'certificates'];

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

/**
 * FinanceStatsCards Feature Organism.
 * Displays financial breakdown by category and payment methods.
 * Refactored to follow BEM and Atomic Design standards.
 */
export const FinanceStatsCards = ({ stats, totalDebt = 0, rentalDebt = 0, t }) => {
    // Separate different types of stats
    const tableStats = stats.filter(s => ['cash', 'transfer', 'withdrawal', 'expenses'].includes(s.type));
    const financialSummary = stats.filter(s => ['cash_balance', 'transfer_balance', 'total_net', 'net_cash'].includes(s.type));

    const otherStats = stats.filter(s => breakdownTypes.includes(s.type));

    return (
        <section className={`${styles.FinanceStatsCards__root}`}>
            {/* Breakdown Cards (Appointments, Prescriptions, Licenses, Certificates) */}
            {otherStats.map((s) => (
                <Card key={s.type} className={`${styles.FinanceStatsCards__card}`}>
                    <h3 className={`${styles.FinanceStatsCards__title}`}>
                        <Icon 
                            name={typeIcons[s.type]} 
                            size="0.8rem" 
                            className={`${styles.FinanceStatsCards__icon} finance-stats__icon--${s.type}`} 
                        />
                        {(t(s.type) || s.type).toUpperCase()}
                    </h3>
                    <div className={`${styles.FinanceStatsCards__breakdown}`}>
                        <table className={`${styles.FinanceStatsCards__table}`}>
                            <thead>
                                <tr>
                                    <th className={`${styles.FinanceStatsCards__tableHeader}`}>{t('period_label')}</th>
                                    <th className={`${styles.FinanceStatsCards__tableHeader} ${styles.FinanceStatsCards__tableHeaderRight}`}>
                                        {t('count_label')}
                                    </th>
                                    <th className={`${styles.FinanceStatsCards__tableHeader} ${styles.FinanceStatsCards__tableHeaderRight}`}>{t('bonified_short') || 'Bonif.'}</th>
                                    <th className={`${styles.FinanceStatsCards__tableHeader} ${styles.FinanceStatsCards__tableHeaderRight}`}>{t('payment')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { l: 'this_day', d: s.today, c: styles.FinanceStatsCards__valuePurple },
                                    { l: 'this_month', d: s.month, c: styles.FinanceStatsCards__valueGray },
                                    { l: 'this_year', d: s.year, c: styles.FinanceStatsCards__valueMuted }
                                ]
                                    .map(row => {
                                        const count = typeof row.d === 'object' ? (row.d?.count ?? 0) : 0;
                                        const paid = typeof row.d === 'object' ? (row.d?.paid ?? 0) : (row.d ?? 0);
                                        const bonified = typeof row.d === 'object' ? (row.d?.bonified ?? 0) : 0;

                                        return (
                                            <tr key={row.l}>
                                                <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__label}`}>{t(row.l) || row.l}</td>
                                                <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueBold} ${row.c}`}>
                                                    {Number(count).toLocaleString()}
                                                </td>
                                                <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueMuted} ${styles.FinanceStatsCards__valueBold}`}>
                                                    {Number(bonified).toLocaleString()}
                                                </td>
                                                <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueGreen} ${styles.FinanceStatsCards__valueBold}`}>
                                                    ${Number(paid).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                        <div className={`${styles.FinanceStatsCards__row} ${styles.FinanceStatsCards__rowDivider}`}>
                            <span className={`${styles.FinanceStatsCards__label} ${styles.FinanceStatsCards__labelBold}`}>{t('debt')}</span>
                            <span className={`${styles.FinanceStatsCards__value} ${s.debt > 0 ? styles.FinanceStatsCards__valueRed : styles.FinanceStatsCards__valueMuted}`}>
                                ${Number(s.debt || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </Card>
            ))}

            {/* Combined Payment Methods Card with Financial Summary */}
            {(tableStats.length > 0 || financialSummary.length > 0) && (
                <Card className={`${styles.FinanceStatsCards__card} ${styles.FinanceStatsCards__cardWide}`}>
                    <h3 className={`${styles.FinanceStatsCards__title}`}>
                        <Icon name="payments" size="0.8rem" className={`${styles.FinanceStatsCards__icon}`} />
                        {(t('payment_methods_summary') || 'Métodos de Pago y Saldos').toUpperCase()}
                    </h3>
                    <div className={`${styles.FinanceStatsCards__breakdown}`}>
                        <table className={`${styles.FinanceStatsCards__table}`}>
                            <thead>
                                <tr>
                                    <th className={`${styles.FinanceStatsCards__tableHeader}`}>{t('concept_label')}</th>
                                    <th className={`${styles.FinanceStatsCards__tableHeader} ${styles.FinanceStatsCards__tableHeaderRight}`}>{t('this_day')}</th>
                                    <th className={`${styles.FinanceStatsCards__tableHeader} ${styles.FinanceStatsCards__tableHeaderRight}`}>{t('this_month')}</th>
                                    <th className={`${styles.FinanceStatsCards__tableHeader} ${styles.FinanceStatsCards__tableHeaderRight}`}>{t('this_year')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableStats.map((s) => {
                                    const isNegative = ['expenses', 'withdrawal'].includes(s.type);
                                    return (
                                        <tr key={s.type} className="finance-stats__method-row">
                                            <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__label}`}>
                                                <Icon 
                                                    name={typeIcons[s.type]} 
                                                    size="0.7rem" 
                                                    className={`${styles.FinanceStatsCards__icon} finance-stats__icon--${s.type}`} 
                                                />
                                                {(t(s.type) || s.type).toUpperCase()}
                                                {s.type === 'cash' ? ` (${t('concept_income')})` : ''}
                                                {s.type === 'transfer' ? ` (${t('concept_income')})` : ''}
                                            </td>
                                            <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueBold} ${isNegative ? styles.FinanceStatsCards__valueRed : styles.FinanceStatsCards__valueBlue}`}>
                                                {isNegative ? '-' : '+'}${Number(s.today).toLocaleString()}
                                            </td>
                                            <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueGray} ${styles.FinanceStatsCards__valueBold}`}>
                                                ${Number(s.month).toLocaleString()}
                                            </td>
                                            <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueMuted} ${styles.FinanceStatsCards__valueBold}`}>
                                                ${Number(s.year).toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {financialSummary.map((s) => (
                                    <tr key={s.type} className={`${styles.FinanceStatsCards__summaryRow}`}>
                                        <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__label} ${styles.FinanceStatsCards__labelBold}`}>
                                            <Icon 
                                                name={typeIcons[s.type]} 
                                                size="0.75rem" 
                                                className={`${styles.FinanceStatsCards__icon} finance-stats__icon--${s.type}`} 
                                            />
                                            = {(t(s.type) || s.type).toUpperCase()}
                                        </td>
                                        <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valuePurple} ${styles.FinanceStatsCards__valueBold}`}>
                                            ${Number(s.today).toLocaleString()}
                                        </td>
                                        <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueGray} ${styles.FinanceStatsCards__valueBold}`}>
                                            ${Number(s.month).toLocaleString()}
                                        </td>
                                        <td className={`${styles.FinanceStatsCards__tableCell} ${styles.FinanceStatsCards__tableCellRight} ${styles.FinanceStatsCards__valueMuted} ${styles.FinanceStatsCards__valueBold}`}>
                                            ${Number(s.year).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Outstanding Debts Card */}
            <Card className={`${styles.FinanceStatsCards__card}`}>
                <h3 className={`${styles.FinanceStatsCards__title}`}>
                    <Icon name="warning" size="0.8rem" className={`${styles.FinanceStatsCards__icon} finance-stats__icon--pending_debt`} />
                    {(t('outstanding_debts') || 'Resumen de Deudas').toUpperCase()}
                </h3>
                <div className={`${styles.FinanceStatsCards__breakdown}`}>
                    <div className={`${styles.FinanceStatsCards__row}`}>
                        <span className={`${styles.FinanceStatsCards__label} ${styles.FinanceStatsCards__labelBold}`}>{t('patient_debt') || 'Deuda de Pacientes'}</span>
                        <span className={`${styles.FinanceStatsCards__value} ${totalDebt > 0 ? styles.FinanceStatsCards__valueRed : styles.FinanceStatsCards__valueMuted}`}>
                            ${Number(totalDebt).toLocaleString()}
                        </span>
                    </div>
                    <div className={`${styles.FinanceStatsCards__row} ${styles.FinanceStatsCards__rowDivider}`}>
                        <span className={`${styles.FinanceStatsCards__label} ${styles.FinanceStatsCards__labelBold}`}>{t('doctor_rental_debt') || 'Deuda de Alquiler (Médicos)'}</span>
                        <span className={`${styles.FinanceStatsCards__value} ${rentalDebt > 0 ? styles.FinanceStatsCards__valueRed : styles.FinanceStatsCards__valueMuted}`}>
                            ${Number(rentalDebt).toLocaleString()}
                        </span>
                    </div>
                    <div className={`${styles.FinanceStatsCards__row} ${styles.FinanceStatsCards__rowDivider}`}>
                        <span className={`${styles.FinanceStatsCards__label} ${styles.FinanceStatsCards__labelBold}`}>{t('total_debt') || 'Deuda Total'}</span>
                        <span className={`${styles.FinanceStatsCards__value} ${totalDebt + rentalDebt > 0 ? styles.FinanceStatsCards__valueRed : styles.FinanceStatsCards__valueMuted}`} style={{ fontWeight: 'bold' }}>
                            ${Number(totalDebt + rentalDebt).toLocaleString()}
                        </span>
                    </div>
                </div>
            </Card>
        </section>
    );
};

