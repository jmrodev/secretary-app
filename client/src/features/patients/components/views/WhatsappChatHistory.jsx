import React from 'react';
import api from '@/api/axios';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import { useWhatsappChatController } from '@/features/patients/hooks/useWhatsappChatController';
import styles from './WhatsappChatHistory.module.css';

const MessageBody = ({ body }) => {
    if (!body) return '';
    // Regex for matches like http://, https://, or www.
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = body.split(urlRegex);
    return parts.map((part, i) => {
        if (urlRegex.test(part)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            return (
                <a 
                    key={i} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

const WhatsappChatHistory = ({ patientId, phone, t, hideHeader = false }) => {
    const { showMessage } = useMessage();
    const {
        state,
        dispatch,
        targetPhoneInput,
        handleTargetPhoneChange,
        messagesEndRef,
        handleGetAiSuggestion,
        handleSendMessage,
        fetchHistory
    } = useWhatsappChatController(patientId, phone, showMessage, t);
    
    const { messages, loading, newMessage, sending, aiLoading } = state;

    const handleDeleteConversation = async () => {
        if (window.confirm("¿Seguro que deseas eliminar esta conversación del historial?")) {
            try {
                await api.post('/whatsapp/delete-conversation', { patientId, phone: targetPhoneInput || phone });
                showMessage("Conversación eliminada con éxito.", "success");
                fetchHistory();
            } catch (err) {
                console.error("Error al borrar conversación", err);
                showMessage("No se pudo eliminar la conversación.", "error");
            }
        }
    };

    return (
        <section className={`${styles.root} ${hideHeader ? 'whatsapp-chat--no-header' : ''}`}>
            <header className={`${styles.header}`}>
                <div className={`${styles.headerInfo}`}>
                    <Icon name="whatsapp" size="1.2rem" />
                    <h3 className={`${styles.title}`}>{t('whatsapp_history')}</h3>
                    <div className={styles.phoneInputContainer} title="Teléfono WhatsMeow (ej: 54249...)">
                        <Icon name="edit" size="0.85rem" />
                        <input
                            type="text"
                            className={styles.targetPhoneInput}
                            value={targetPhoneInput}
                            onChange={(e) => handleTargetPhoneChange(e.target.value)}
                            placeholder="542494521825..."
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <Button size="sm" variant="ghost" onClick={fetchHistory} title="Refrescar" icon={<Icon name="refresh" size="1rem" />}>
                        {t('refresh')}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDeleteConversation} title="Eliminar conversación" icon={<Icon name="delete" size="1rem" />}>
                    </Button>
                </div>
            </header>
            
            <div className={`${styles.messages}`}>
                {loading && messages.length === 0 ? (
                    <div className="whatsapp-chat__loading">{t('loading')}</div>
                ) : messages.length === 0 ? (
                    <div className={`${styles.empty}`}>{t('no_messages_yet')}</div>
                ) : (
                    messages.map((msg, index) => {
                        const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                        const isOutbound = msg.direction === 'outbound';
                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && <div className={styles.dateDivider}><span>{formatDate(msg.created_at)}</span></div>}
                                <div className={`${styles.bubbleWrapper} ${isOutbound ? styles.bubbleWrapperOutbound : styles.bubbleWrapperInbound}`}>
                                    <div className={`${styles.bubble} ${isOutbound ? styles.bubbleOutbound : styles.bubbleInbound}`}>
                                        <p className={styles.text}><MessageBody body={msg.body} /></p>
                                        <div className={styles.meta}>
                                            <span className={styles.time}>{formatTime(msg.created_at)}</span>
                                            {isOutbound && (
                                                <span 
                                                    className={`${styles.status} ${msg.status === 'delivered' ? styles.statusDelivered : msg.status === 'failed' ? styles.statusFailed : ''}`}
                                                    title={msg.status === 'failed' ? 'Error al enviar por WhatsApp' : ''}
                                                >
                                                    <Icon name={msg.status === 'delivered' ? 'done_all' : msg.status === 'failed' ? 'error_outline' : 'done'} size="12px" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className={`${styles.inputArea}`} onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <input
                    type="text"
                    className={`${styles.input}`}
                    placeholder={t('write_message')}
                    value={newMessage}
                    onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
                    disabled={sending}
                />
                <button 
                    type="button" 
                    className={`${styles.aiBtn} ${aiLoading ? styles.aiBtnLoading : ''}`}
                    onClick={handleGetAiSuggestion}
                    title={t('ai_suggestion')}
                    disabled={aiLoading || sending}
                >
                    <Icon name="auto_awesome" size="1.2rem" />
                </button>
                <button type="submit" className={`${styles.sendBtn}`} disabled={sending || !newMessage.trim()}>
                    <Icon name="send" size="1.2rem" />
                </button>
            </form>
        </section>
    );
};

export default WhatsappChatHistory;
