import { createContext, useContext } from 'react';
<<<<<<< HEAD
import './MessageContext.css';
import { useMessageLogic } from './useMessageLogic';
=======
import { useMessageLogic } from '@/context/useMessageLogic';
>>>>>>> main

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const value = useMessageLogic();

    return (
        <MessageContext.Provider value={value}>
            {children}
            {value.text && (
                <div className={`toast-container ${value.type === 'error' ? 'toast-error' : 'toast-info'}`}>
                    {value.text}
                </div>
            )}
        </MessageContext.Provider>
    );
};
