
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

/**
 * FinancesPage (Orchestrator).
 * Coordinates financial stats, transactions, and cash box management.
 */
export const FinancesPage = ({ MedicationInputComponent }) => {
    const controller = useFinancesPageController();
    const [showStats, setShowStats] = React.useState(false);
    const {
        stats,
        loading,
        filteredTransactions,
        user,
        settings,
        t,
        handlers
    } = controller;

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

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="finances-page__action-btn--badge"
                                    onClick={() => handlers.setPendingClosuresOpen(true)}
                                    icon={<Icon name="calendar_view_week" size="1.1rem" />}
                                >
                                    {t('deliver_box')}
                                    <Badge 
                                        count={controller.pendingClosures.length} 
                                        position="top-right" 
                                        variant="danger" 
                                    />
                                </Button>
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

                            <article className="dashboard-card no-padding">
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
                            </article>
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

