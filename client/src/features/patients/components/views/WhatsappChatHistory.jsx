import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import { useWhatsappChatController } from '@/features/patients/hooks/useWhatsappChatController';
import './WhatsappChatHistory.css';

const WhatsappChatHistory = ({ patientId, phone, t, hideHeader = false }) => {
    const { showMessage } = useMessage();
    const {
        state,
        dispatch,
        messagesEndRef,
        handleGetAiSuggestion,
        handleSendMessage,
        fetchHistory
    } = useWhatsappChatController(patientId, phone, showMessage, t);
    
    const { messages, loading, newMessage, sending, aiLoading } = state;

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

            <form className="whatsapp-chat__input-area" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <input
                    type="text"
                    className="whatsapp-chat__input"
                    placeholder={t('write_message')}
                    value={newMessage}
                    onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
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
