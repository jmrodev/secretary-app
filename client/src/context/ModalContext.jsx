import React, { createContext, use, useMemo } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useLanguage } from '@/hooks/useLanguage';
import { useModalLogic } from '@/context/useModalLogic';

const ModalContext = createContext(null);

export const useModal = () => {
    const context = use(ModalContext);
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
    const { t } = useLanguage();

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
                labels={{
                    alert: t('alert'),
                    confirm: t('confirm'),
                    close: t('close'),
                    cancel: t('cancel'),
                    accept: t('accept')
                }}
            />
        </ModalContext.Provider>
    );
};
