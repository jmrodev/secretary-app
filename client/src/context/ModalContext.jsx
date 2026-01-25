import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmModal from '../components/molecules/ConfirmModal';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'confirm',
        initialValue: '',
        resolve: null
    });

    const showModal = useCallback((type, message, title = '', initialValue = '') => {
        return new Promise((resolve) => {
            setModalConfig({
                isOpen: true,
                type,
                message,
                title,
                initialValue,
                resolve
            });
        });
    }, []);

    const alert = (message, title) => showModal('alert', message, title);
    const confirm = (message, title) => showModal('confirm', message, title);
    const prompt = (message, defaultValue = '', title = '') => showModal('prompt', message, title, defaultValue);

    const doubleConfirm = async (message1, message2, title1 = '', title2 = '') => {
        const first = await confirm(message1, title1);
        if (!first) return false;
        return await confirm(message2 || "Are you absolutely sure? This action is irreversible.", title2 || "Final Confirmation");
    };

    const handleConfirm = (value) => {
        if (modalConfig.resolve) {
            modalConfig.resolve(value);
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleCancel = () => {
        if (modalConfig.resolve) {
            modalConfig.resolve(modalConfig.type === 'confirm' ? false : null);
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    return (
        <ModalContext.Provider value={{ alert, confirm, prompt, doubleConfirm }}>
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
