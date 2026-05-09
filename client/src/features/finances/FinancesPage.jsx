
import React from 'react';

// Atomic Design Components
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import { useFinancesPageController } from '@/features/finances/hooks/useFinancesPageController';
import FinanceStatsCards from '@/features/finances/components/FinanceStatsCards';
import EditTransactionModal from '@/features/finances/components/EditTransactionModal';
import TransactionModal from '@/features/finances/components/TransactionModal';
import FinanceSidebar from '@/features/finances/components/FinanceSidebar';
import TransactionsTable from '@/features/finances/components/TransactionsTable';
import CashBoxDeliveryModal from '@/features/finances/components/CashBoxDeliveryModal';
import PendingClosuresModal from '@/features/finances/components/PendingClosuresModal';

import './FinancesPage.css';

/**
 * FinancesPage (Orchestrator).
 * Coordinates financial stats, transactions, and cash box management.
 */
const FinancesPage = () => {
    const controller = useFinancesPageController();
    const {
        stats,
        loading,
        doctors,
        selectedDoctorFilter, // This is a string like '3' or 'all'
        modalOpen,
        closeBoxModal,
        closeAmount,
        editingTx,
        filters,
        filteredTransactions,
        user,
        settings,
        t,
        handlers
    } = controller;

    const isAdminOrSecretary = user && (user.role === 'admin' || user.role === 'secretary');

    return (
        <MainLayout wide flush title={t('finances') || 'Finanzas'}>
            <div className="finances-page layout-content-area">
                <section className="animate-fade-in">
                    <h2 className="visually-hidden">{t('financial_operations_area') || 'Área de Operaciones Financieras'}</h2>
                    {loading && filteredTransactions.length === 0 ? (
                        <Loading variant="centered" text={t('loading') || 'Cargando...'} />
                    ) : (
                        <div className="dashboard-layout__grid">
                            <aside className="dashboard-layout__sidebar">
                                <FinanceSidebar
                                    isAdminOrSecretary={isAdminOrSecretary}
                                    user={user}
                                    doctors={doctors}
                                    selectedDoctorFilter={selectedDoctorFilter}
                                    pendingClosuresCount={controller.pendingClosures.length}
                                    onOpenNewTransaction={handlers.onOpenNewTransaction}
                                    onOpenPendingClosures={() => handlers.setPendingClosuresOpen(true)}
                                    onSelectDoctor={handlers.onSelectDoctor}
                                    onOpenCloseBox={handlers.onOpenCloseBox}
                                    calculateBalance={handlers.calculateBalance}
                                    calculateBalanceByMethod={handlers.calculateBalanceByMethod}
                                    filters={filters}
                                    handlers={handlers}
                                    t={t}
                                />
                            </aside>

                            <section className="dashboard-layout__main">
                                <h3 className="visually-hidden">{t('transactions_and_stats') || 'Transacciones y Estadísticas'}</h3>
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
                            </section>
                        </div>
                    )}
                </section>

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
            </div>
        </MainLayout>
    );
};

export default FinancesPage;
