import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import styles from './CashMonitorCard.module.css';

const arCurrencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const formatAmount = (val) => arCurrencyFormatter.format(val);

/**
 * CashMonitorCard (Molecule).
 * Displays real-time cash balance and theoretical totals.
 */
export const CashMonitorCard = React.memo(({ stats, t, className = '' }) => {
    const cashToday = Number(stats?.todayCash || 0);
    const withdrawalsToday = Number(stats?.todayWithdrawalCash || 0);
    const expensesToday = Number(stats?.todayExpenseCash || 0);
    const currentBalance = cashToday - withdrawalsToday - expensesToday;

    return (
        <article className={`${styles.CashMonitorCard__root} ${className}`}>
            <header className={styles.CashMonitorCard__header}>
                <Icon name="payments" className={styles.CashMonitorCard__headerIcon} />
                {t('cash_monitor') || 'Monitor de Caja'}
            </header>

            <div className={styles.CashMonitorCard__statsRow}>
                <div className={styles.CashMonitorCard__statItem}>
                    <div className={styles.CashMonitorCard__statValue}>{formatAmount(currentBalance)}</div>
                    <div className={styles.CashMonitorCard__statLabel}>{t('current_cash') || 'Efectivo en Caja'}</div>
                </div>

                <div className={`${styles.CashMonitorCard__statItem} ${styles['CashMonitorCard__statItem--divider']}`}>
                    <div className={`${styles.CashMonitorCard__statValue} ${styles['CashMonitorCard__statValue--muted']}`}>
                        {formatAmount(stats?.todayTransfer || 0)}
                    </div>
                    <div className={styles.CashMonitorCard__statLabel}>{t('transfers_today') || 'Transferencias Hoy'}</div>
                </div>
            </div>

            <div className={styles.CashMonitorCard__breakdown}>
                <div className={styles.CashMonitorCard__breakdownItem}>
                    <span className={styles.CashMonitorCard__breakdownIncome}>+</span> {formatAmount(cashToday)} {t('income_short') || 'Ing.'}
                </div>
                <div className={styles.CashMonitorCard__breakdownItem}>
                    <span className={styles.CashMonitorCard__breakdownExpense}>-</span> {formatAmount(withdrawalsToday + expensesToday)} {t('out_short') || 'Egr.'}
                </div>
            </div>
        </article>
    );
});