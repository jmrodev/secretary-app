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
import FinanceDoctorFilter from '../components/molecules/FinanceDoctorFilter';
import CashBoxSummary from '../components/molecules/CashBoxSummary';
import CashBoxDeliveryModal from '../components/molecules/CashBoxDeliveryModal';
import TransactionsTable from '../components/organisms/TransactionsTable';
import EditTransactionModal from '../components/organisms/EditTransactionModal';
import TransactionModal from '../components/molecules/TransactionModal';

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
                        <aside className="dashboard-sidebar">
                            <div className="dashboard-nav-bar animate-fadeIn">
                                <div className="flex-1">
                                    {isAdminOrSecretary && (
                                        <FinanceDoctorFilter
                                            doctors={doctors}
                                            selectedDoctorFilter={selectedDoctorFilter}
                                            setSelectedDoctorFilter={handlers.onSelectDoctor}
                                            t={t}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <h3 className="dashboard-card__title">
                                    <Icon name="build" size="1.2rem" />
                                    {t('actions') || 'Acciones'}
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {user.role !== 'patient' && (
                                        <Button
                                            variant="primary"
                                            className="justify-start w-full"
                                            onClick={handlers.onOpenNewTransaction}
                                            icon={<Icon name="add" size="1.1rem" />}
                                        >
                                            {t('new_transaction')}
                                        </Button>
                                    )}

                                    {selectedDoctorFilter && (() => {
                                        const d = doctors.find(doc => doc.id == selectedDoctorFilter);
                                        const balances = handlers.calculateBalanceByMethod(selectedDoctorFilter);
                                        if (d && balances.cash > 0) {
                                            return (
                                                <Button
                                                    variant="secondary"
                                                    className="justify-start w-full"
                                                    onClick={() => handlers.onOpenCloseBox(d, balances.cash)}
                                                    icon={<Icon name="payments" size="1.1rem" />}
                                                >
                                                    {t('deliver')} a {d.full_name?.split(' ')[0]}
                                                </Button>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>

                            {user.role === 'secretary' && (
                                <div className="dashboard-card">
                                    <h3 className="dashboard-card__title">
                                        <Icon name="analytics" size="1.2rem" />
                                        {t('summary') || 'Resumen de Caja'}
                                    </h3>
                                    <CashBoxSummary
                                        doctors={doctors}
                                        selectedDoctorFilter={selectedDoctorFilter}
                                        onSelectDoctor={handlers.onSelectDoctor}
                                        calculateBalance={handlers.calculateBalance}
                                        calculateBalanceByMethod={handlers.calculateBalanceByMethod}
                                        t={t}
                                        compact
                                    />
                                </div>
                            )}
                        </aside>

                        <main className="dashboard-main">
                            {isAdminOrSecretary && stats.length > 0 && (
                                <FinanceStatsCards stats={stats} t={t} />
                            )}

                            <div className="dashboard-card no-padding">
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
                            </div>
                        </main>
                    </div>
                )}

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

                {editingTx && (
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
                )}
            </div>
        </MainLayout>
    );
};

export default Finances;
