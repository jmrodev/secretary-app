
import React from 'react';

// Atomic Design Components
import { MainLayout } from '@/components/templates/MainLayout';
import { Loading } from '@/components/atoms/Loading';
import { useFinancesPageController } from '@/features/finances/hooks/useFinancesPageController';
import { FinanceStatsCards } from '@/features/finances/components/sections/FinanceStatsCards';
import { FinanceModalOrchestrator } from '@/features/finances/components/FinanceModalOrchestrator';
import { FeatureToolbar } from '@/components/organisms/FeatureToolbar';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { TransactionsTable } from '@/features/finances/components/tables/TransactionsTable';

import styles from './FinancesPage.module.css';

/**
 * FinancesPage (Orchestrator).
 * Coordinates financial stats, transactions, and cash box management.
 */
export const FinancesPage = ({ MedicationInputComponent }) => {
    const controller = useFinancesPageController();
    const [showStats, setShowStats] = React.useState(false);
    const [deliveryMenuOpen, setDeliveryMenuOpen] = React.useState(false);
    const menuRef = React.useRef(null);
    const {
        stats,
        loading,
        filteredTransactions,
        user,
        settings,
        t,
        handlers
    } = controller;

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setDeliveryMenuOpen(false);
            }
        };
        if (deliveryMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [deliveryMenuOpen]);

    const isAdminOrSecretary = user && (user.role === 'admin' || user.role === 'secretary');

    return (
        <MainLayout title={t('finances')}>
            <div>
                <FeatureToolbar
                    className="__toolbar"
                    actions={
                        isAdminOrSecretary && (
                            <div className="finances-page__toolbar-actions">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowStats(!showStats)}
                                    icon={<Icon name={showStats ? "visibility_off" : "visibility"} size="1.1rem" />}
                                >
                                    {showStats ? (t('hide_summary')) : (t('show_summary'))}
                                </Button>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handlers.onOpenNewTransaction}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new_transaction')}
                                </Button>

                                <div className={styles.FinancesPage__dropdownContainer} ref={menuRef}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="finances-page__action-btn--badge"
                                        onClick={() => setDeliveryMenuOpen(!deliveryMenuOpen)}
                                        icon={<Icon name="calendar_view_week" size="1.1rem" />}
                                    >
                                        {t('deliver_box')}
                                        <Badge 
                                            count={controller.pendingClosures.length} 
                                            position="top-right" 
                                            variant="danger" 
                                        />
                                    </Button>

                                    {deliveryMenuOpen && (
                                        <div className={`${styles.FinancesPage__dropdownMenu} animate-fade-in`}>
                                            <button
                                                type="button"
                                                className={styles.FinancesPage__dropdownItem}
                                                onClick={() => {
                                                    setDeliveryMenuOpen(false);
                                                    handlers.setPendingClosuresOpen(true);
                                                }}
                                            >
                                                <span className={styles.FinancesPage__dropdownItemContent}>
                                                    <Icon name="history" size="1rem" />
                                                    {t('view_pending_closures') || 'Ver Cierres Pendientes'}
                                                </span>
                                                {controller.pendingClosures.length > 0 && (
                                                    <Badge 
                                                        count={controller.pendingClosures.length} 
                                                        variant="danger" 
                                                    />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                className={styles.FinancesPage__dropdownItem}
                                                onClick={() => {
                                                    setDeliveryMenuOpen(false);
                                                    handlers.onOpenTodayBalancing();
                                                }}
                                            >
                                                <span className={styles.FinancesPage__dropdownItemContent}>
                                                    <Icon name="account_balance_wallet" size="1.1rem" />
                                                    {t('today_cash_balancing') || 'Arqueo de Hoy'}
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }
                />

                <section >
                    {loading && filteredTransactions.length === 0 ? (
                        <Loading variant="centered" text={t('loading')} />
                    ) : (
                        <div className="__content">
                            {isAdminOrSecretary && showStats && stats.length > 0 && (
                                <FinanceStatsCards 
                                    stats={stats} 
                                    totalDebt={controller.totalDebt}
                                    rentalDebt={controller.rentalDebt}
                                    t={t} 
                                />
                            )}

                            <TransactionsTable
                                transactions={filteredTransactions}
                                totalCount={controller.totalCount}
                                currentPage={controller.currentPage}
                                totalPages={controller.totalPages}
                                onPageChange={handlers.onPageChange}
                                user={user}
                                settings={settings}
                                t={t}
                                onEdit={handlers.onEditTransaction}
                                onDelete={handlers.onDeleteTransaction}
                                onGenerateInvoice={handlers.onGenerateInvoice}
                                onSync={handlers.onSyncTransaction}
                                alert={controller.alert}
                            />
                        </div>
                    )}
                </section>
            </div>

            <FinanceModalOrchestrator
                controller={controller}
                MedicationInputComponent={MedicationInputComponent}
            />
        </MainLayout>
    );
};

