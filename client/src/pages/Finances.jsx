
import React from 'react';
import { useFinancesPageController } from '../controllers/useFinancesPageController';

// Atomic Design Components
import Card from '../components/atoms/Card';
import Sidebar from '../components/organisms/Sidebar';
import Button from '../components/atoms/Button';

// Molecules/Organisms
import FinanceStatsCards from '../components/molecules/FinanceStatsCards';
import FinanceDoctorFilter from '../components/molecules/FinanceDoctorFilter';
import CashBoxSummary from '../components/molecules/CashBoxSummary';
import CashBoxDeliveryModal from '../components/molecules/CashBoxDeliveryModal';
import TransactionsTable from '../components/organisms/TransactionsTable';
import EditTransactionModal from '../components/organisms/EditTransactionModal';
import TransactionModal from '../components/molecules/TransactionModal';

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
        user,
        settings,
        t,
        handlers
    } = controller;

    if (loading) return <div className="centered-loader"><div className="status-display__spinner"></div></div>;

    const isAdminOrSecretary = user.role === 'admin' || user.role === 'secretary';

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content dashboard-wide">
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('finances')}</h1>
                        <p className="page-header__subtitle">{t('finances_subtitle') || 'Control de caja y transacciones médicas.'}</p>
                    </div>
                </header>

                {isAdminOrSecretary && (
                    <FinanceDoctorFilter
                        doctors={doctors}
                        selectedDoctorFilter={selectedDoctorFilter}
                        setSelectedDoctorFilter={handlers.onSelectDoctor}
                        t={t}
                    />
                )}

                {/* Finance Controls Header Row */}
                <div className="finances-header">
                    {/* Stats Cards */}
                    {isAdminOrSecretary && stats.length > 0 && (
                        <FinanceStatsCards stats={stats} t={t} />
                    )}

                    {/* Quick Actions */}
                    {user.role !== 'patient' && (
                        <Card className="finances-actions">
                            <Button size="sm" onClick={handlers.onOpenNewTransaction}>
                                ✨ {t('new_transaction')}
                            </Button>

                            {selectedDoctorFilter && (() => {
                                const d = doctors.find(doc => doc.id == selectedDoctorFilter);
                                const balances = handlers.calculateBalanceByMethod(selectedDoctorFilter);
                                if (d && balances.cash > 0) {
                                    return (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handlers.onOpenCloseBox(d, balances.cash)}
                                        >
                                            💰 {t('deliver')} a {d.full_name?.split(' ')[0]}
                                        </Button>
                                    );
                                }
                                return null;
                            })()}
                        </Card>
                    )}

                    {/* Cash Box Summary */}
                    {user.role === 'secretary' && (
                        <CashBoxSummary
                            doctors={doctors}
                            selectedDoctorFilter={selectedDoctorFilter}
                            onSelectDoctor={handlers.onSelectDoctor}
                            calculateBalance={handlers.calculateBalance}
                            calculateBalanceByMethod={handlers.calculateBalanceByMethod}
                            t={t}
                            compact
                        />
                    )}
                </div>

                {/* Transactions Table - Full Width */}
                <TransactionsTable
                    transactions={transactions}
                    user={user}
                    settings={settings}
                    t={t}
                    onEdit={handlers.onEditTransaction}
                    onDelete={handlers.onDeleteTransaction}
                    onGenerateInvoice={handlers.onGenerateInvoice}
                    onSync={handlers.onSyncTransaction}
                    alert={controller.alert}
                />

                {/* --- Modals --- */}
                <TransactionModal
                    isOpen={modalOpen}
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
            </main>
        </div>
    );
};

export default Finances;
