import React, { useState, useEffect, useRef } from 'react';
import api from '@/api/axios';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './WhatsappChatHistory.css';

const WhatsappChatHistory = ({ patientId, t, hideHeader = false }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await api.post('/whatsapp/history', { patientId });
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching WhatsApp history", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patientId) {
            fetchHistory();
            
            // Auto-polling para sentirlo en vivo (cada 3 segundos)
            const intervalId = setInterval(() => {
                api.post('/whatsapp/history', { patientId })
                   .then(res => {
                       if (res.data.success) {
                           setMessages(res.data.data);
                       }
                   }).catch(err => console.error("Auto-poll error", err));
            }, 3000);
            
            return () => clearInterval(intervalId);
        }
    }, [patientId]);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);
            // Primero obtenemos el paciente para saber su teléfono
            const patientRes = await api.get(`/users/patients/${patientId}`);
            let phone = patientRes.data.phone.replace(/\D/g, '');
            if (!phone.startsWith('54') && phone.length >= 10) phone = '549' + phone;

            await api.post('/whatsapp/send-direct', {
                to: phone,
                message: newMessage,
                patientId: patientId
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
                <button type="submit" className="whatsapp-chat__send-btn" disabled={sending || !newMessage.trim()}>
                    <Icon name="send" size="1.2rem" />
                </button>
            </form>
        </section>
    );
};

export default WhatsappChatHistory;
