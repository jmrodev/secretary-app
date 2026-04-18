import { createContext, useContext } from 'react';
import { useMessageLogic } from '@/context/useMessageLogic';

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
