import React from 'react';
import { useFinancesPageController } from '../controllers/useFinancesPageController';

// Atomic Design Components
import MainLayout from '../components/templates/MainLayout';
import Button from '../components/atoms/Button';
import Loading from '../components/atoms/Loading';
import Card from '../components/atoms/Card';
import Icon from '../components/atoms/Icon';

// Molecules/Organisms
import FinanceStatsCards from '../components/molecules/FinanceStatsCards';
import CashBoxDeliveryModal from '../components/molecules/CashBoxDeliveryModal';
import TransactionsTable from '../components/organisms/TransactionsTable';
import EditTransactionModal from '../components/organisms/EditTransactionModal';
import TransactionModal from '../components/molecules/TransactionModal';
import PendingClosuresModal from '../components/molecules/PendingClosuresModal';
import FinanceSidebar from '../components/organisms/FinanceSidebar';

import './Finances.css';

const Finances = () => {
    const controller = useFinancesPageController();
    const {
        transactions,
        stats,
        loading,
        doctors,
        selectedDoctorFilter,
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

    const isAdminOrSecretary = user.role === 'admin' || user.role === 'secretary';

    return (
        <MainLayout wide>
            <div className="finances-page">
                <header className="dashboard-header animate-fadeIn">
                    <h1 className="dashboard-header__title">{t('finances')}</h1>
                    <p className="dashboard-header__subtitle">{t('finances_subtitle') || 'Control de caja y transacciones médicas.'}</p>
                </header>

                {loading ? (
                    <Loading variant="centered" text={t('loading') || "Cargando..."} />
                ) : (
                    <div className="dashboard-grid animate-fadeIn">
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

                        <main className="dashboard-main">
                            {isAdminOrSecretary && stats.length > 0 && (
                                <FinanceStatsCards stats={stats} t={t} />
                            )}

                            <div className="dashboard-card no-padding">
                                <TransactionsTable
                                    transactions={filteredTransactions}
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
                        </main>
                    </div>
                )}

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
            </div >
        </MainLayout >
    );
};

export default Finances;
