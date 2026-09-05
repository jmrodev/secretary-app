import React from 'react';
import { TransactionModal } from '@/features/finances/components/modals/TransactionModal';
import { CashBalancingModal } from '@/features/finances/components/modals/CashBalancingModal';
import { EditTransactionModal } from '@/features/finances/components/modals/EditTransactionModal';
import { PendingClosuresModal } from '@/features/finances/components/modals/PendingClosuresModal';

/**
 * FinanceModalOrchestrator.
 * Centralizes all domain modal dialogs for FinancesPage to reduce coupling in the main page component.
 */
export const FinanceModalOrchestrator = ({ controller, MedicationInputComponent }) => {
    const {
        modalOpen,
        selectedDoctorFilter,
        balancingModal,
        editingTx,
        pendingClosuresOpen,
        pendingClosures,
        duplicateClosures = [],
        doctors = [],
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

            {balancingModal && (
                <CashBalancingModal
                    isOpen={!!balancingModal}
                    onClose={() => handlers.setBalancingModal(null)}
                    day={balancingModal}
                    onConfirm={handlers.handleAutoClosure}
                    doctors={doctors}
                    onSelectDoctor={handlers.onSelectDoctor}
                    t={t}
                />
            )}

            {editingTx && (
                <EditTransactionModal
                    key={`edit-tx-${editingTx.id}-${editingTx._isDirectEdit ? 'edit' : 'view'}`}
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

