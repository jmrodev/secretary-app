import { useState, useReducer, useCallback, useRef, useEffect, useEffectEvent } from 'react';
import { api } from '@/api/axios';

const initialState = {
    messages: [],
    loading: true,
    newMessage: '',
    sending: false,
    aiLoading: false,
    suggestedSlot: null,
    editingMessage: null // { id, body }
};

function chatReducer(state, action) {
    switch (action.type) {
        case 'SET_MESSAGES': return { ...state, messages: action.payload, loading: false };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_NEW_MESSAGE': return { ...state, newMessage: action.payload };
        case 'SET_SENDING': return { ...state, sending: action.payload };
        case 'SET_AI_LOADING': return { ...state, aiLoading: action.payload };
        case 'SET_EDITING_MESSAGE':
            return {
                ...state,
                editingMessage: action.payload,
                newMessage: action.payload ? action.payload.body : ''
            };
        case 'CANCEL_EDIT':
            return {
                ...state,
                editingMessage: null,
                newMessage: ''
            };
        case 'SET_AI_SUGGESTION':
            return {
                ...state,
                newMessage: action.payload.suggestion,
                suggestedSlot: action.payload.suggestedSlot || null,
                aiLoading: false
            };
        case 'CLEAR_SUGGESTED_SLOT':
            return { ...state, suggestedSlot: null };
        case 'SEND_SUCCESS': return { ...state, newMessage: '', sending: false, suggestedSlot: null, editingMessage: null };
        default: return state;
    }
}

const normalizePhone = (raw) => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    return !digits.startsWith('54') && digits.length >= 10 ? '549' + digits : digits;
};

export const useWhatsappChatController = (patientId, phone, showMessage, t) => {
    const [state, dispatch] = useReducer(chatReducer, initialState);
    const [targetPhoneInput, setTargetPhoneInput] = useState(phone || '');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        if (patientId) {
            api.get(`/users/patients/${patientId}`).then(patientRes => {
                const patientData = patientRes.data?.success !== undefined ? patientRes.data.data : patientRes.data;
                if (isMounted && patientData?.phone) setTargetPhoneInput(patientData.phone);
            }).catch(err => console.error("Error fetching patient phone", err));
        } else if (phone) {
            queueMicrotask(() => {
                if (isMounted) setTargetPhoneInput(phone);
            });
        }
        return () => { isMounted = false; };
    }, [patientId, phone]);

    const handleTargetPhoneChange = (val) => {
        const hasPlus = val.startsWith('+');
        const digits = val.replace(/\D/g, '');
        setTargetPhoneInput((hasPlus ? '+' : '') + digits);
    };

    const fetchHistory = useCallback(async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const res = await api.post('/whatsapp/history', { patientId, phone: targetPhoneInput || phone });
            if (res.data.success) {
                dispatch({ type: 'SET_MESSAGES', payload: res.data.data });
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } catch (error) {
            console.error("Error fetching WhatsApp history", error);
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [patientId, phone, targetPhoneInput]);

    const onFetchHistory = useEffectEvent(() => {
        fetchHistory();
    });

    useEffect(() => {
        if (patientId || phone || targetPhoneInput) {
            const initFetchTimer = setTimeout(() => onFetchHistory(), 0);
            
            const intervalId = setInterval(() => {
                api.post('/whatsapp/history', { patientId, phone: targetPhoneInput || phone })
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
    }, [patientId, phone, targetPhoneInput]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [state.messages.length]);

    const handleGetAiSuggestion = async () => {
        if (state.aiLoading) return;
        try {
            dispatch({ type: 'SET_AI_LOADING', payload: true });
            const res = await api.post('/whatsapp/ai-suggestion', { 
                patientId, 
                phone: targetPhoneInput || phone 
            });
            
            if (res.data.success && res.data.suggestion) {
                dispatch({
                    type: 'SET_AI_SUGGESTION',
                    payload: {
                        suggestion: res.data.suggestion,
                        suggestedSlot: res.data.suggestedSlot || null
                    }
                });
            } else {
                showMessage(t('ai_no_context'), "warning");
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
            let finalPhone = targetPhoneInput ? normalizePhone(targetPhoneInput) : '';
            let patientName = '';

            if (!finalPhone && patientId) {
                const patientRes = await api.get(`/users/patients/${patientId}`);
                const patientData = patientRes.data?.success !== undefined ? patientRes.data.data : patientRes.data;
                finalPhone = normalizePhone(patientData?.phone);
                patientName = patientData?.full_name || '';
            } else if (!finalPhone && phone) {
                finalPhone = normalizePhone(phone);
            }

            if (!finalPhone || finalPhone.replace(/\D/g, '').length < 8) {
                const msg = patientName
                    ? t('phone_required')
                    : t('phone_required');
                showMessage(msg, "error");
                dispatch({ type: 'SET_SENDING', payload: false });
                return;
            }

            if (state.editingMessage) {
                // Modo edición
                const res = await api.post('/whatsapp/edit', {
                    messageId: state.editingMessage.id,
                    newText: state.newMessage,
                    chat: finalPhone
                });
                if (res.data.success) {
                    showMessage(t('message_edited', 'Mensaje editado'), "success");
                    dispatch({ type: 'SEND_SUCCESS' });
                    fetchHistory();
                } else {
                    showMessage(t('error_editing_message', "Error al editar mensaje."), "error");
                    dispatch({ type: 'SET_SENDING', payload: false });
                }
                return;
            }

            const res = await api.post('/whatsapp/send-direct', {
                to: finalPhone,
                message: state.newMessage,
                patientId
            });
            
            if (res.data.success) {
                showMessage(t('message_sent'), "success");
                dispatch({ type: 'SEND_SUCCESS' });
                fetchHistory();
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

    const handleSendFile = async (file, caption = '') => {
        if (!file) return;
        try {
            dispatch({ type: 'SET_SENDING', payload: true });
            let finalPhone = targetPhoneInput ? normalizePhone(targetPhoneInput) : '';
            if (!finalPhone && patientId) {
                const patientRes = await api.get(`/users/patients/${patientId}`);
                const patientData = patientRes.data?.success !== undefined ? patientRes.data.data : patientRes.data;
                finalPhone = normalizePhone(patientData?.phone);
            } else if (!finalPhone && phone) {
                finalPhone = normalizePhone(phone);
            }

            if (!finalPhone || finalPhone.replace(/\D/g, '').length < 8) {
                showMessage(t('phone_required'), "error");
                dispatch({ type: 'SET_SENDING', payload: false });
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('to', finalPhone);
            if (caption) formData.append('caption', caption);
            if (patientId) formData.append('patientId', patientId);

            const res = await api.post('/whatsapp/send-file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                showMessage(t('file_sent_success', 'Archivo enviado con éxito'), 'success');
                dispatch({ type: 'SEND_SUCCESS' });
                fetchHistory();
            } else {
                showMessage(t('error_sending_file', 'Error al enviar archivo'), 'error');
                dispatch({ type: 'SET_SENDING', payload: false });
            }
        } catch (error) {
            console.error('Error al enviar archivo:', error);
            showMessage(t('error_sending_file', 'Error al enviar archivo'), 'error');
            dispatch({ type: 'SET_SENDING', payload: false });
        }
    };

    const handleRevokeMessage = async (messageId) => {
        if (!messageId) return;
        let finalPhone = targetPhoneInput ? normalizePhone(targetPhoneInput) : normalizePhone(phone);
        try {
            const res = await api.post('/whatsapp/revoke', {
                messageId,
                chat: finalPhone
            });
            if (res.data.success) {
                showMessage(t('message_revoked_success', 'Mensaje eliminado para todos'), 'success');
                fetchHistory();
            } else {
                showMessage(t('error_revoking_message', 'Error al eliminar mensaje'), 'error');
            }
        } catch (error) {
            console.error('Error al revocar mensaje:', error);
            showMessage(t('error_revoking_message', 'Error al eliminar mensaje'), 'error');
        }
    };

    const handleSyncChat = async () => {
        let finalPhone = targetPhoneInput ? normalizePhone(targetPhoneInput) : normalizePhone(phone);
        if (!finalPhone) return;
        try {
            showMessage(t('syncing_chat', 'Sincronizando mensajes con el teléfono...'), 'info');
            const res = await api.post('/whatsapp/sync', { phone: finalPhone, count: 50 });
            if (res.data.success) {
                showMessage(t('sync_success', 'Mensajes sincronizados'), 'success');
                fetchHistory();
            }
        } catch (error) {
            console.error('Error al sincronizar chat:', error);
            showMessage(t('sync_error', 'Error al sincronizar con el teléfono'), 'error');
        }
    };

    return {
        state,
        dispatch,
        targetPhoneInput,
        handleTargetPhoneChange,
        messagesEndRef,
        handleGetAiSuggestion,
        handleSendMessage,
        handleSendFile,
        handleRevokeMessage,
        handleSyncChat,
        fetchHistory
    };
};
