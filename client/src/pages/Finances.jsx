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
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('finances')}</h1>
                        <p className="page-header__subtitle">{t('finances_subtitle') || 'Control de caja y transacciones médicas.'}</p>
                    </div>
                </header>

                {loading ? (
                    <Loading variant="centered" text={t('loading') || "Cargando..."} />
                ) : (
                    <>
                        <div className="finances-page__controls">
                            {isAdminOrSecretary && (
                                <FinanceDoctorFilter
                                    doctors={doctors}
                                    selectedDoctorFilter={selectedDoctorFilter}
                                    setSelectedDoctorFilter={handlers.onSelectDoctor}
                                    t={t}
                                />
                            )}

                            <div className="finances-page__actions-row">
                                <div className="finances-page__main-info">
                                    {isAdminOrSecretary && stats.length > 0 && (
                                        <FinanceStatsCards stats={stats} t={t} />
                                    )}

                                    {user.role !== 'patient' && (
                                        <Card className="finances-page__actions-card">
                                            <Button size="sm" variant="primary" onClick={handlers.onOpenNewTransaction} icon={<Icon name="ADD" size="1.1rem" />}>
                                                {t('new_transaction')}
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
                                                            icon={<Icon name="FINANCES" size="1.1rem" />}
                                                        >
                                                            {t('deliver')} a {d.full_name?.split(' ')[0]}
                                                        </Button>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </Card>
                                    )}
                                </div>

                                {user.role === 'secretary' && (
                                    <div className="finances-page__summary-section">
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
                            </div>
                        </div>

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
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default Finances;
