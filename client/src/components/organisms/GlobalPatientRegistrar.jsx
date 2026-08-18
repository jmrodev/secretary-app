import React, { useState, useEffect } from 'react';
import { PatientManagerModal } from '@/features/patients/components/modals/PatientManagerModal';

/**
 * GlobalPatientRegistrar
 * Listens for global events to open the patient registration modal from anywhere.
 * Specifically used by the WhatsApp messenger to help those who can't register themselves.
 */
export const GlobalPatientRegistrar = () => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        initialData: null
    });

    useEffect(() => {
        const handleOpen = (event) => {
            const { phone } = event.detail || {};
            
            setModalState({
                isOpen: true,
                initialData: phone ? {
                    phoneNumbers: [{ phone_number: phone, label: 'Celular', is_primary: true }]
                } : null
            });
        };

        window.addEventListener('openPatientRegistration', handleOpen);
        return () => window.removeEventListener('openPatientRegistration', handleOpen);
    }, []);

    const handleClose = () => {
        setModalState({ isOpen: false, initialData: null });
    };

    return (
        <>
            {modalState.isOpen && (
                <PatientManagerModal
                    isOpen={modalState.isOpen}
                    onClose={handleClose}
                    patient={modalState.initialData}
                    onUpdate={() => {
                        handleClose();
                    }}
                />
            )}
        </>
    );
};

