import React from 'react';
import TransactionModal from '@/features/finances/components/modals/TransactionModal';
import CashBoxDeliveryModal from '@/features/finances/components/modals/CashBoxDeliveryModal';
import EditTransactionModal from '@/features/finances/components/modals/EditTransactionModal';
import PendingClosuresModal from '@/features/finances/components/modals/PendingClosuresModal';

/**
 * FinanceModalOrchestrator.
 * Centralizes all domain modal dialogs for FinancesPage to reduce coupling in the main page component.
 */
const FinanceModalOrchestrator = ({ controller, MedicationInputComponent }) => {
    const {
        modalOpen,
        selectedDoctorFilter,
        closeBoxModal,
        closeAmount,
        editingTx,
        pendingClosuresOpen,
        pendingClosures,
        duplicateClosures = [],
        user,
        settings,
        t,
        handlers
    } = controller;

    return (
        <>
            <TransactionModal
                isOpen={modalOpen}
                initialData={selectedDoctorFilter && selectedDoctorFilter !== 'all' ? { doctorId: parseInt(selectedDoctorFilter, 10) } : null}
                onClose={handlers.onCloseNewTransaction}
                onSuccess={handlers.onRefresh}
                MedicationInputComponent={MedicationInputComponent}
            />

            <CashBoxDeliveryModal
                isOpen={closeBoxModal?.open}
                onClose={handlers.onCloseCloseBox}
                onConfirm={handlers.onCloseBox}
                doctorName={closeBoxModal?.doctorName}
                balance={closeBoxModal?.balance}
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

            <PendingClosuresModal
                isOpen={pendingClosuresOpen}
                onClose={() => handlers.setPendingClosuresOpen(false)}
                pendingClosures={pendingClosures}
                duplicateClosures={duplicateClosures}
                onAutoClosure={handlers.handleAutoClosure}
                onCloseAll={handlers.handleCloseAllPending}
                onFixDuplicates={handlers.handleFixDuplicates}
                onResetDay={handlers.handleResetDay}
                t={t}
            />
        </>
    );
};

export default FinanceModalOrchestrator;
