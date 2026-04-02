import React, { createContext, useContext, useMemo } from 'react';
import ConfirmModal from '../components/molecules/ConfirmModal';
import { useModalLogic } from './useModalLogic';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

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
