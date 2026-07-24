import { useReducer, useCallback, useRef, useEffect, useEffectEvent } from 'react';
import api from '@/api/axios';

const initialState = {
    messages: [],
    loading: true,
    newMessage: '',
    sending: false,
    aiLoading: false,
};

function chatReducer(state, action) {
    switch (action.type) {
        case 'SET_MESSAGES': return { ...state, messages: action.payload, loading: false };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_NEW_MESSAGE': return { ...state, newMessage: action.payload };
        case 'SET_SENDING': return { ...state, sending: action.payload };
        case 'SET_AI_LOADING': return { ...state, aiLoading: action.payload };
        case 'SEND_SUCCESS': return { ...state, newMessage: '', sending: false };
        default: return state;
    }
}

const normalizePhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    return !digits.startsWith('54') && digits.length >= 10 ? '549' + digits : digits;
};

export const useWhatsappChatController = (patientId, phone, showMessage, t) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const messagesEndRef = useRef(null);

    const fetchHistory = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const res = await api.post('/whatsapp/history', { patientId, phone });
            if (res.data.success) {
                dispatch({ type: 'SET_MESSAGES', payload: res.data.data });
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } catch (error) {
            console.error("Error fetching WhatsApp history", error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [patientId, phone]);

    const onFetchHistory = useEffectEvent(() => {
        fetchHistory();
    });

    useEffect(() => {
        if (patientId || phone) {
            const initFetchTimer = setTimeout(() => onFetchHistory(), 0);
            
            const intervalId = setInterval(() => {
                api.post('/whatsapp/history', { patientId, phone })
                   .then(res => {
                       if (res.data.success) {
                           dispatch({ type: 'SET_MESSAGES', payload: res.data.data });
                       }
                   }).catch(err => console.error("Auto-poll error", err));
            }, 5000);
            
            return () => {
                clearTimeout(initFetchTimer);
                clearInterval(intervalId);
            };
        }
    }, [patientId, phone]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.messages.length]);

    const handleGetAiSuggestion = async () => {
        if (state.aiLoading) return;
        try {
            dispatch({ type: 'SET_AI_LOADING', payload: true });
            const res = await api.post('/whatsapp/ai-suggestion', { patientId });
            
            if (res.data.success && res.data.suggestion) {
                dispatch({ type: 'SET_NEW_MESSAGE', payload: res.data.suggestion });
            } else {
                showMessage(t('ai_no_context') || "La IA no pudo generar una respuesta.", "warning");
            }
        } catch (error) {
            console.error("[AI] Error al obtener sugerencia:", error);
            showMessage("Error de conexión con la IA", "error");
        } finally {
            dispatch({ type: 'SET_AI_LOADING', payload: false });
        }
    };

    const handleSendMessage = async () => {
        if (!state.newMessage.trim() || state.sending) return;
        
        try {
            dispatch({ type: 'SET_SENDING', payload: true });
            let targetPhone;
            if (patientId) {
                const patientRes = await api.get(`/users/patients/${patientId}`);
                targetPhone = normalizePhone(patientRes.data.phone);
            } else if (phone) {
                targetPhone = normalizePhone(phone);
            } else {
                return;
            }

            const res = await api.post('/whatsapp/send', {
                patientId,
                phone: targetPhone,
                message: state.newMessage
            });
            
            if (res.data.success) {
                showMessage(t('message_sent') || "Mensaje enviado", "success");
                dispatch({ type: 'SEND_SUCCESS' });
                fetchHistory(); // refresh history
            } else {
                showMessage("Error al enviar mensaje.", "error");
                dispatch({ type: 'SET_SENDING', payload: false });
            }
        } catch (error) {
            console.error("Error al enviar", error);
            showMessage("Error de conexión al enviar.", "error");
            dispatch({ type: 'SET_SENDING', payload: false });
        }
    };

    return {
        state,
        dispatch,
        messagesEndRef,
        handleGetAiSuggestion,
        handleSendMessage
    };
};
