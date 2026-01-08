import { createContext, useContext, useState, useCallback } from 'react';

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const [message, setMessage] = useState(null);

    const showMessage = useCallback((text, type = 'info') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    }, []);

    return (
        <MessageContext.Provider value={{ showMessage }}>
            {children}
            {message && (
                <div className={`toast-container ${message.type === 'error' ? 'toast-error' : 'toast-info'}`}>
                    {message.text}
                </div>
            )}
        </MessageContext.Provider>
    );
};
