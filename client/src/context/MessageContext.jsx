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
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    padding: '1rem 2rem',
                    background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#991b1b' : '#166534',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    fontWeight: '500',
                    border: message.type === 'error' ? '1px solid #f87171' : '1px solid #4ade80'
                }}>
                    {message.text}
                </div>
            )}
        </MessageContext.Provider>
    );
};
