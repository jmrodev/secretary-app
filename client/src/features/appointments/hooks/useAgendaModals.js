import { useState } from 'react';

/**
 * useAgendaModals
 * Manages the state of all modals in the appointments page.
 */
export const useAgendaModals = () => {
    const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });
    const [actionModal, setActionModal] = useState({ open: false, appt: null });
    const [historyModal, setHistoryModal] = useState({ open: false, patientId: null, patientName: '' });
    const [prescribeModal, setPrescribeModal] = useState({ 
        open: false, apptId: null, patientName: '', medications: '', instructions: '' 
    });
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [retryAction, setRetryAction] = useState(null);

    return {
        editPatientModalOpen, setEditPatientModalOpen,
        paymentModal, setPaymentModal,
        actionModal, setActionModal,
        historyModal, setHistoryModal,
        prescribeModal, setPrescribeModal,
        authModalOpen, setAuthModalOpen,
        retryAction, setRetryAction
    };
};
