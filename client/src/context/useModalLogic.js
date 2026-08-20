import { useState, useCallback, useMemo } from 'react';

export const useModalLogic = () => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm',
        initialValue: '',
        inputType: 'text',
        resolve: null
    });

    const showModal = useCallback((type, message, title = '', initialValue = '', inputType = 'text') => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                type,
                message,
                title,
                initialValue,
                inputType,
                resolve
            });
        });
    }, []);

    const alert = useCallback((message, title) => 
        showModal('alert', message, title), [showModal]);

    const confirm = useCallback((message, title) => 
        showModal('confirm', message, title), [showModal]);

    const prompt = useCallback((message, defaultValue = '', title = '', inputType = 'text') => 
        showModal('prompt', message, title, defaultValue, inputType), [showModal]);

    const doubleConfirm = useCallback(async (message1, message2, title1 = '', title2 = '') => {
        const first = await confirm(message1, title1);
        if (!first) return false;
        return await confirm(message2 || "Are you absolutely sure? This action is irreversible.", title2 || "Final Confirmation");
    }, [confirm]);

    const handleConfirm = useCallback((value) => {
        if (modalConfig.resolve) {
            modalConfig.resolve(value);
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, [modalConfig]);

    const handleCancel = useCallback(() => {
        if (modalConfig.resolve) {
            modalConfig.resolve(modalConfig.type === 'confirm' ? false : null);
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    }, [modalConfig]);

    const value = useMemo(() => ({
        alert,
        confirm,
        prompt,
        doubleConfirm,
        modalConfig,
        handleConfirm,
        handleCancel
    }), [alert, confirm, prompt, doubleConfirm, modalConfig, handleConfirm, handleCancel]);

    return value;
};
