
import React from 'react';

// Atomic Design Components
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import { useFinancesPageController } from '@/features/finances/hooks/useFinancesPageController';
import FinanceStatsCards from '@/features/finances/components/sections/FinanceStatsCards';
import EditTransactionModal from '@/features/finances/components/modals/EditTransactionModal';
import TransactionModal from '@/features/finances/components/modals/TransactionModal';
import FeatureToolbar from '@/components/organisms/FeatureToolbar';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Badge from '@/components/atoms/Badge';
import TransactionsTable from '@/features/finances/components/tables/TransactionsTable';
import CashBoxDeliveryModal from '@/features/finances/components/modals/CashBoxDeliveryModal';
import PendingClosuresModal from '@/features/finances/components/modals/PendingClosuresModal';

import styles from './FinancesPage.module.css';

/**
 * FinancesPage (Orchestrator).
 * Coordinates financial stats, transactions, and cash box management.
 */
const FinancesPage = () => {
    const controller = useFinancesPageController();
    const {
        stats,
        loading,
        selectedDoctorFilter,
        modalOpen,
        closeBoxModal,
        closeAmount,
        editingTx,
        filteredTransactions,
        user,
        settings,
        t,
        handlers
    } = controller;

    const isAdminOrSecretary = user && (user.role === 'admin' || user.role === 'secretary');

    return (
        <MainLayout wide flush title={t('finances') || 'Finanzas'}>
            <div className={`${styles.financesPageOrchestrator} layout-content-area animate-fade-in`}>
                <FeatureToolbar
                    className="finances-page-orchestrator__toolbar"
                    actions={
                        isAdminOrSecretary && (
                            <div className="finances-page__toolbar-actions">
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
                                    {t('deliver_box') || 'Entregar Caja'}
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

                <main className="finances-page-orchestrator__main">
                    <h2 className="visually-hidden">{t('financial_operations_area') || 'Área de Operaciones Financieras'}</h2>
                    
                    {loading && filteredTransactions.length === 0 ? (
                        <Loading variant="centered" text={t('loading') || 'Cargando...'} />
                    ) : (
                        <div className="finances-page-orchestrator__content">
                            {isAdminOrSecretary && stats.length > 0 && (
                                <FinanceStatsCards stats={stats} t={t} />
                            )}

                            <article className="dashboard-card no-padding">
                                <h4 className="visually-hidden">{t('transactions_list') || 'Listado de Transacciones'}</h4>
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
                </main>
            </div>

                {/* --- Modals --- */}
                <TransactionModal
                    isOpen={modalOpen}
                    initialData={selectedDoctorFilter && selectedDoctorFilter !== 'all' ? { doctorId: parseInt(selectedDoctorFilter) } : null}
                    onClose={handlers.onCloseNewTransaction}
                    onSuccess={handlers.onRefresh}
                />

                <CashBoxDeliveryModal
                    isOpen={closeBoxModal.open}
                    onClose={handlers.onCloseCloseBox}
                    onConfirm={handlers.onCloseBox}
                    doctorName={closeBoxModal.doctorName}
                    balance={closeBoxModal.balance}
                    amount={closeAmount}
                    setAmount={handlers.setCloseAmount}
                    t={t}
                />

                {
                    editingTx && (
                        <EditTransactionModal
                            isOpen={!!editingTx}
                            onClose={() => handlers.setEditingTx(null)}
                            onSave={handlers.onUpdateTransaction}
                            transaction={editingTx}
                            setTransaction={handlers.setEditingTx}
                            settings={settings}
                            user={user}
                            t={t}
                        />
                    )
                }

                <PendingClosuresModal
                    isOpen={controller.pendingClosuresOpen}
                    onClose={() => handlers.setPendingClosuresOpen(false)}
                    pendingClosures={controller.pendingClosures}
                    duplicateClosures={controller.duplicateClosures}
                    onAutoClosure={handlers.handleAutoClosure}
                    onCloseAll={handlers.handleCloseAllPending}
                    onFixDuplicates={handlers.handleFixDuplicates}
                    onResetDay={handlers.handleResetDay}
                    t={t}
                />
        </MainLayout>
    );
};

export default FinancesPage;
