import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/context/LanguageContext';
import './ChatWindow.css';

/**
 * ChatWindow Component (Feature Component).
 * Renders the full-screen view of a chat thread.
 */
const ChatWindow = ({
    selectedConvo,
    thread,
    user,
    loading,
    sending,
    messageText,
    setMessageText,
    onSendMessage,
    scrollRef
}) => {
    const { t } = useLanguage();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        return isToday
            ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    if (!selectedConvo) {
        return (
            <section className="chat-main chat-main--empty">
                <Icon name="CHAT" size="3rem" className="chat-main__empty-icon" />
                <h2 className="chat-main__empty-title">{t('my_messages')}</h2>
                <p className="chat-main__empty-text">{t('chat_empty_state')}</p>
            </section>
        );
    }

    return (
        <section className="chat-window">
            {/* Header */}
            <header className="chat-window__header">
                <div className="chat-window__convo-avatar">
                    {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                </div>
                <div className="chat-window__header-info">
                    <h3 className="chat-window__header-title">{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                    <small className="chat-window__header-subtitle">{selectedConvo.subject || t('active_conversation')}</small>
                </div>
            </header>

            {/* Messages Area */}
            <section className="chat-window__messages" ref={scrollRef}>
                <h3 className="visually-hidden">{t('message_history') || 'Historial de Mensajes'}</h3>
                {loading ? (
                    <div className="chat-window__messages-status">
                        <div className="loading-spinner"></div>
                    </div>
                ) : thread.length === 0 ? (
                    <div className="chat-window__messages-status chat-window__messages-status--empty">
                        <Icon name="INFO" size="2.5rem" className="chat-window__empty-icon" />
                        <p>{t('say_hello')}</p>
                    </div>
                ) : (
                    thread.map(msg => (
                        <article key={msg.id} className={`chat-window__bubble ${msg.sender_id === user?.user_id ? 'chat-window__bubble--sent' : 'chat-window__bubble--received'}`}>
                            <h4 className="visually-hidden">{t('message')}</h4>
                            <div className="chat-window__bubble-content">
                                {msg.message}
                                <span className="chat-window__bubble-time">{formatDate(msg.created_at)}</span>
                            </div>
                        </article>
                    ))
                )}
            </section>

            {/* Input Area */}
            <footer className="chat-window__footer">
                <form className="chat-window__input-area" onSubmit={onSendMessage}>
                    <div className="chat-window__input-wrapper">
                        <input
                            type="text"
                            placeholder={t('type_message_placeholder')}
                            className="chat-window__input"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={sending}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="chat-window__send-button"
                        disabled={sending || !messageText.trim()}
                        variant="primary"
                        icon={sending ? undefined : <Icon name="SEND" />}
                    >
                        {sending && <div className="loading-spinner"></div>}
                    </Button>
                </form>
            </footer>
        </section>
    );
};

export default ChatWindow;
