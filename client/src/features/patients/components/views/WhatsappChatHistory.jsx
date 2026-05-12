import React, { useState, useEffect, useRef, useCallback, useEffectEvent } from 'react';
import api from '@/api/axios';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import './WhatsappChatHistory.css';

const normalizePhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    return !digits.startsWith('54') && digits.length >= 10 ? '549' + digits : digits;
};

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

const WhatsappChatHistory = ({ patientId, phone, t, hideHeader = false }) => {
    const { showMessage } = useMessage();
    const [state, dispatch] = React.useReducer(chatReducer, initialState);
    const { messages, loading, newMessage, sending, aiLoading } = state;
    
    const setMessages = (val) => dispatch({ type: 'SET_MESSAGES', payload: val });
    const setLoading = (val) => dispatch({ type: 'SET_LOADING', payload: val });
    const setNewMessage = (val) => dispatch({ type: 'SET_NEW_MESSAGE', payload: val });
    const setSending = (val) => dispatch({ type: 'SET_SENDING', payload: val });
    const setAiLoading = (val) => dispatch({ type: 'SET_AI_LOADING', payload: val });

    const messagesEndRef = useRef(null);

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.post('/whatsapp/history', { patientId, phone });
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching WhatsApp history", error);
        } finally {
            setLoading(false);
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
                           setMessages(res.data.data);
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
    }, [messages.length]);

    const handleGetAiSuggestion = async () => {
        if (aiLoading) return;
        try {
            setAiLoading(true);
            const res = await api.post('/whatsapp/ai-suggestion', { patientId });
            
            if (res.data.success && res.data.suggestion) {
                setNewMessage(res.data.suggestion);
            } else {
                showMessage(t('ai_no_context') || "La IA no pudo generar una respuesta.", "warning");
            }
        } catch (error) {
            console.error("[AI] Error al obtener sugerencia:", error);
            showMessage("Error de conexión con la IA", "error");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            let targetPhone;
            if (patientId) {
                const patientRes = await api.get(`/users/patients/${patientId}`);
                targetPhone = normalizePhone(patientRes.data.phone);
            } else if (phone) {
                targetPhone = normalizePhone(phone);
            } else {
                return;
            }

            await api.post('/whatsapp/send-direct', {
                to: targetPhone,
                message: newMessage,
                patientId: patientId || null
            });
            
            setNewMessage('');
            fetchHistory();
        } catch (error) {
            console.error("Error sending message", error);
            showMessage(t('error_sending_whatsapp'), "error");
        } finally {
            setSending(false);
        }
    };

    return (
        <section className={`whatsapp-chat ${hideHeader ? 'whatsapp-chat--no-header' : ''}`}>
            {!hideHeader && (
                <header className="whatsapp-chat__header">
                    <div className="whatsapp-chat__header-info">
                        <Icon name="whatsapp" size="1.2rem" />
                        <h3 className="whatsapp-chat__title">{t('whatsapp_history')}</h3>
                    </div>
                    <Button size="sm" variant="ghost" onClick={fetchHistory} icon={<Icon name="refresh" size="1rem" />}>
                        {t('refresh')}
                    </Button>
                </header>
            )}
            
            <div className="whatsapp-chat__messages">
                {loading && messages.length === 0 ? (
                    <div className="whatsapp-chat__loading">{t('loading')}</div>
                ) : messages.length === 0 ? (
                    <div className="whatsapp-chat__empty">{t('no_messages_yet')}</div>
                ) : (
                    messages.map((msg, index) => {
                        const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && <div className="whatsapp-chat__date-divider">{formatDate(msg.created_at)}</div>}
                                <div className={`whatsapp-chat__bubble whatsapp-chat__bubble--${msg.direction}`}>
                                    <p className="whatsapp-chat__text">{msg.body}</p>
                                    <div className="whatsapp-chat__meta">
                                        <span className="whatsapp-chat__time">{formatTime(msg.created_at)}</span>
                                        {msg.direction === 'outbound' && (
                                            <span className={`whatsapp-chat__status whatsapp-chat__status--${msg.status}`}>
                                                <Icon name={msg.status === 'delivered' ? 'done_all' : 'done'} size="12px" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="whatsapp-chat__input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className="whatsapp-chat__input"
                    placeholder={t('write_message')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                />
                <button 
                    type="button" 
                    className={`whatsapp-chat__ai-btn ${aiLoading ? 'whatsapp-chat__ai-btn--loading' : ''}`}
                    onClick={handleGetAiSuggestion}
                    title={t('ai_suggestion')}
                    disabled={aiLoading || sending}
                >
                    <Icon name="auto_awesome" size="1.2rem" />
                </button>
                <button type="submit" className="whatsapp-chat__send-btn" disabled={sending || !newMessage.trim()}>
                    <Icon name="send" size="1.2rem" />
                </button>
            </form>
        </section>
    );
};

export default WhatsappChatHistory;
