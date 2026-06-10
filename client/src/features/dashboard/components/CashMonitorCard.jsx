import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from '../DashboardPage.module.css';

/**
 * CashMonitorCard (Molecule).
 * Displays real-time cash balance and theoretical totals.
 */
const CashMonitorCard = ({ stats, t }) => {
    const cashToday = Number(stats?.todayCash || 0);
    const withdrawalsToday = Number(stats?.todayWithdrawalCash || 0);
    const expensesToday = Number(stats?.todayExpenseCash || 0);
    const currentBalance = cashToday - withdrawalsToday - expensesToday;

    const formatAmount = (val) => 
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

    return (
        <article className={`${styles.bentoCard} ${styles.cashMonitorCard}`}>
            <header className={styles.bentoHeader}>
                <Icon name="payments" className={styles.bentoHeaderIcon} />
                {t('cash_monitor') || 'Monitor de Caja'}
            </header>
            
            <div className={styles.statsRow}>
                <div className={styles.statItem}>
                    <div className={styles.statValue}>{formatAmount(currentBalance)}</div>
                    <div className={styles.statLabel}>{t('current_cash') || 'Efectivo en Caja'}</div>
                </div>
                
                <div className={styles.statItem} style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className={styles.statValue} style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                        {formatAmount(stats?.todayTransfer || 0)}
                    </div>
                    <div className={styles.statLabel}>{t('transfers_today') || 'Transferencias Hoy'}</div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', opacity: 0.7 }}>
                <div style={{ fontSize: '0.7rem' }}>
                    <span style={{ color: '#00f2fe' }}>+</span> {formatAmount(cashToday)} {t('income_short') || 'Ing.'}
                </div>
                <div style={{ fontSize: '0.7rem' }}>
                    <span style={{ color: '#ff4d4f' }}>-</span> {formatAmount(withdrawalsToday + expensesToday)} {t('out_short') || 'Egr.'}
                </div>
            </div>
        </article>
    );
};

export default React.memo(CashMonitorCard);
