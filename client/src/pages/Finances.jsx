
import React from 'react';
import { useFinancesPageController } from '../hooks/useFinancesPageController';

// Atomic Design Components
import Card from '../components/atoms/Card';
import Sidebar from '../components/organisms/Sidebar';

// Extracted Molecules/Organisms
import FinanceStatsCards from '../components/molecules/FinanceStatsCards';
import FinanceDoctorFilter from '../components/molecules/FinanceDoctorFilter';
import CashBoxSummary from '../components/molecules/CashBoxSummary';
import CashBoxDeliveryModal from '../components/molecules/CashBoxDeliveryModal';
import TransactionsTable from '../components/organisms/TransactionsTable';
import EditTransactionModal from '../components/organisms/EditTransactionModal';
import TransactionModal from '../components/molecules/TransactionModal'; // Already existed, reusing

const Finances = () => {
    // 1. Controller Hook
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
        user,
        settings,
        t,
        handlers
    } = useFinancesPageController();

    if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

    const isAdminOrSecretary = user.role === 'admin' || user.role === 'secretary';

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">

                {/* Doctor Filter Tabs */}
                {isAdminOrSecretary && (
                    <FinanceDoctorFilter
                        doctors={doctors}
                        selectedDoctorFilter={selectedDoctorFilter}
                        setSelectedDoctorFilter={handlers.onSelectDoctor}
                        t={t}
                    />
                )}

                {/* Stats (Admin/Secretary) */}
                {isAdminOrSecretary && (
                    <FinanceStatsCards stats={stats} t={t} />
                )}

                <div className={user.role !== 'patient' ? 'grid-Sidebar-2fr gap-8' : 'grid-1-col'}>

                    {/* Sidebar / Controls for Staff */}
                    {user.role !== 'patient' && (
                        <div className="flex-col gap-8">
                            <Card>
                                <h3>🚀 {t('quick_actions') || 'Acciones Rápidas'}</h3>
                                <div className="flex flex-wrap gap-3 mt-2">
                                    <button className="btn btn-primary w-fit whitespace-nowrap" onClick={handlers.onOpenNewTransaction}>
                                        ✨ {t('new_transaction')}
                                    </button>

                                    {/* Logic for "Close Box" Button if a doctor is selected */}
                                    {selectedDoctorFilter && (() => {
                                        const d = doctors.find(doc => doc.id == selectedDoctorFilter);
                                        const bal = handlers.calculateBalance(selectedDoctorFilter);
                                        if (d && bal > 0) {
                                            return (
                                                <button
                                                    className="btn btn-secondary w-fit border-green-200 text-green-700 hover:bg-green-50 whitespace-nowrap"
                                                    onClick={() => handlers.onOpenCloseBox(d, bal)}
                                                >
                                                    💰 {t('deliver')} a {d.full_name?.split(' ')[0]}
                                                </button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </Card>

                            {/* Cash Box Summary (Per Doctor) */}
                            {user.role === 'secretary' && (
                                <CashBoxSummary
                                    doctors={doctors}
                                    selectedDoctorFilter={selectedDoctorFilter}
                                    onSelectDoctor={handlers.onSelectDoctor}
                                    calculateBalance={handlers.calculateBalance}
                                    t={t}
                                />
                            )}
                        </div>
                    )}

                    {/* Transaction Log */}
                    <TransactionsTable
                        transactions={transactions}
                        user={user}
                        settings={settings}
                        t={t}
                        onEdit={handlers.onEditTransaction}
                        onDelete={handlers.onDeleteTransaction}
                    />
                </div>

                {/* --- Modals managed by state --- */}

                {/* New Transaction */}
                <TransactionModal
                    isOpen={modalOpen}
                    onClose={handlers.onCloseNewTransaction}
                    onSuccess={handlers.onRefresh}
                />

                {/* Close Box (Deliver Cash) */}
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

                {/* Edit Transaction */}
                <EditTransactionModal
                    isOpen={!!editingTx}
                    onClose={() => handlers.setEditingTx(null)}
                    onSave={handlers.onUpdateTransaction}
                    transaction={editingTx}
                    setTransaction={handlers.setEditingTx}
                    settings={settings}
                    t={t}
                />

            </main>
        </div>
    );
};

export default Finances;
