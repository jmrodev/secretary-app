import { createContext, use } from 'react';
import { useMessageLogic } from '@/context/useMessageLogic';

const MessageContext = createContext();

export const useMessage = () => use(MessageContext);

export const MessageProvider = ({ children }) => {
    const value = useMessageLogic();

    return (
        <MessageContext value={value}>
            {children}
            {value.text && (
                <div className={`toast-container ${value.type === 'error' ? 'toast-error' : 'toast-info'}`}>
                    {value.text}
                </div>
            )}
        </MessageContext>
    );
};
