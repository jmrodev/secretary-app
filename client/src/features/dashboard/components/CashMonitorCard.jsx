import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from '../DashboardPage.module.css';

/**
 * CashMonitorCard (Molecule).
 * Displays real-time cash balance and theoretical totals.
 */
export const CashMonitorCard = React.memo(({ stats, t }) => {
    const cashToday = Number(stats?.todayCash || 0);
    const withdrawalsToday = Number(stats?.todayWithdrawalCash || 0);
    const expensesToday = Number(stats?.todayExpenseCash || 0);
    const currentBalance = cashToday - withdrawalsToday - expensesToday;

    const formatAmount = (val) => 
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

    return (
        <article className={`${styles.DashboardPage__bentoCard} ${styles.DashboardPage__cashMonitorCard}`}>
            <header className={styles.DashboardPage__bentoHeader}>
                <Icon name="payments" className={styles.DashboardPage__bentoHeaderIcon} />
                {t('cash_monitor') || 'Monitor de Caja'}
            </header>
            
            <div className={styles.DashboardPage__statsRow}>
                <div className={styles.DashboardPage__statItem}>
                    <div className={styles.DashboardPage__statValue}>{formatAmount(currentBalance)}</div>
                    <div className={styles.DashboardPage__statLabel}>{t('current_cash') || 'Efectivo en Caja'}</div>
                </div>
                
                <div className={styles.DashboardPage__statItem} style={{ borderLeft: '1px solid var(--border-color)' }}>
                    <div className={styles.DashboardPage__statValue} style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>
                        {formatAmount(stats?.todayTransfer || 0)}
                    </div>
                    <div className={styles.DashboardPage__statLabel}>{t('transfers_today') || 'Transferencias Hoy'}</div>
                </div>
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1.25rem', opacity: 0.9 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--success)' }}>+</span> {formatAmount(cashToday)} {t('income_short') || 'Ing.'}
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--error)' }}>-</span> {formatAmount(withdrawalsToday + expensesToday)} {t('out_short') || 'Egr.'}
                </div>
            </div>
        </article>
    );
});
