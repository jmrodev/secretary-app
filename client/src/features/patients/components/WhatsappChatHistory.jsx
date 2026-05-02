import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/api/axios';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import './WhatsappChatHistory.css';

const normalizePhone = (raw) => {
    const digits = raw.replace(/\D/g, '');
    return !digits.startsWith('54') && digits.length >= 10 ? '549' + digits : digits;
};

const WhatsappChatHistory = ({ patientId, phone, t, hideHeader = false }) => {
    const { showMessage } = useMessage();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
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

    useEffect(() => {
        if (patientId || phone) {
            fetchHistory();
            
            // Auto-polling para sentirlo en vivo (cada 3 segundos)
            const intervalId = setInterval(() => {
                api.post('/whatsapp/history', { patientId, phone })
                   .then(res => {
                       if (res.data.success) {
                           setMessages(res.data.data);
                       }
                   }).catch(err => console.error("Auto-poll error", err));
            }, 3000);
            
            return () => clearInterval(intervalId);
        }
    }, [patientId, phone, fetchHistory]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    const formatTime = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString();
    };

    const handleGetAiSuggestion = async () => {
        if (aiLoading) return;
        try {
            setAiLoading(true);
            console.log("[AI] Solicitando sugerencia para paciente:", patientId);
            
            const res = await api.post('/whatsapp/ai-suggestion', { patientId });
            
            if (res.data.success && res.data.suggestion) {
                setNewMessage(res.data.suggestion);
                console.log("[AI] Sugerencia recibida:", res.data.suggestion);
            } else {
                console.warn("[AI] El servidor no devolvió una sugerencia válida:", res.data);
                showMessage(t('ai_no_context') || "La IA no pudo generar una respuesta. Verificá si el doctor tiene el contexto configurado.", "warning");
            }
        } catch (error) {
            console.error("[AI] Error al obtener sugerencia:", error);
            const errorMsg = error.response?.data?.error || "Error de conexión con la IA";
            showMessage(errorMsg, "error");
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
                // Get phone from patient record
                const patientRes = await api.get(`/users/patients/${patientId}`);
                targetPhone = normalizePhone(patientRes.data.phone);
            } else if (phone) {
                // Use the phone passed directly (unknown contact)
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
            fetchHistory(); // Recargar para ver el mensaje enviado
        } catch (error) {
            console.error("Error sending message", error);
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
                        <h3 className="whatsapp-chat__title">{t('whatsapp_history') || 'Historial de Conversación'}</h3>
                    </div>
                    <Button size="sm" variant="ghost" onClick={fetchHistory} icon={<Icon name="refresh" size="1rem" />}>
                        {t('refresh') || 'Actualizar'}
                    </Button>
                </header>
            )}
            
            <div className="whatsapp-chat__messages">
                {loading && messages.length === 0 ? (
                    <div className="whatsapp-chat__loading">{t('loading') || 'Cargando mensajes...'}</div>
                ) : messages.length === 0 ? (
                    <div className="whatsapp-chat__empty">{t('no_messages_yet') || 'No hay mensajes previos.'}</div>
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
                    placeholder={t('write_message') || 'Escribe un mensaje...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                />
                <button 
                    type="button" 
                    className={`whatsapp-chat__ai-btn ${aiLoading ? 'whatsapp-chat__ai-btn--loading' : ''}`}
                    onClick={handleGetAiSuggestion}
                    title="Sugerencia IA (Gemini)"
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
