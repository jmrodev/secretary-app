import React, { createContext, useContext, useMemo } from 'react';
import ConfirmModal from '@/components/molecules/ConfirmModal';
import { useModalLogic } from '@/context/useModalLogic';

const ModalContext = createContext(null);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        // Safe fallback to prevent crashes if used outside provider
        return {
            alert: () => Promise.resolve(),
            confirm: () => Promise.resolve(false),
            prompt: () => Promise.resolve(null),
            doubleConfirm: () => Promise.resolve(false)
        };
    }
    return context;
};

export const ModalProvider = ({ children }) => {
    const { 
        alert, confirm, prompt, doubleConfirm, 
        modalConfig, handleConfirm, handleCancel 
    } = useModalLogic();

    const contextValue = useMemo(() => ({
        alert,
        confirm,
        prompt,
        doubleConfirm
    }), [alert, confirm, prompt, doubleConfirm]);

    return (
        <ModalContext.Provider value={contextValue}>
            {children}
            <ConfirmModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                initialValue={modalConfig.initialValue}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ModalContext.Provider>
    );
};
