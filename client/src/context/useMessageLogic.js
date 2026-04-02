import { useReducer, useCallback, useMemo } from 'react';

const initialState = {
    text: null,
    type: 'info'
};

const messageReducer = (state, action) => {
    switch (action.type) {
        case 'SHOW_MESSAGE':
            return {
                text: action.payload.text,
                type: action.payload.type || 'info'
            };
        case 'CLEAR_MESSAGE':
            return initialState;
        default:
            return state;
    }
};

export const useMessageLogic = () => {
    const [state, dispatch] = useReducer(messageReducer, initialState);

    const showMessage = useCallback((text, type = 'info') => {
        dispatch({ type: 'SHOW_MESSAGE', payload: { text, type } });
        
        // Auto-clear message after 3 seconds
        setTimeout(() => {
            dispatch({ type: 'CLEAR_MESSAGE' });
        }, 3000);
    }, []);

    const value = useMemo(() => ({
        ...state,
        showMessage
    }), [state, showMessage]);

    return value;
};
