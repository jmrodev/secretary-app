import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
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
    scrollRef,
    onBack // Added onBack prop
}) => {

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
            <section className="chat-window chat-window--empty">
                <div className="chat-window__empty-icon"><Icon name="chat" size="4rem" /></div>
                <h2 className="chat-window__empty-title">Tus Mensajes</h2>
                <p className="chat-window__empty-text">Selecciona una conversación de la lista para empezar a chatear o busca un contacto para iniciar un nuevo chat.</p>
            </section>
        );
    }

    return (
        <section className="chat-window">
            {/* Header */}
            <header className="chat-window__header">
                {/* Back button for mobile navigation */}
                <button className="chat-window__back-button" onClick={onBack} title="Volver a la lista">
                    <Icon name="arrow_back" />
                </button>

                <div className="chat-window__convo-avatar">
                    {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                </div>
                <div className="chat-window__header-info">
                    <h3 className="chat-window__header-title">{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                    <small className="chat-window__header-subtitle">{selectedConvo.subject || 'Conversación activa'}</small>
                </div>
            </header>

            {/* Messages Area */}
            <section className="chat-window__messages" ref={scrollRef}>
                {loading ? (
                    <div className="chat-window__messages-status">
                        <div className="loading-spinner"></div>
                    </div>
                ) : thread.length === 0 ? (
                    <div className="chat-window__messages-status chat-window__messages-status--empty">
                        <div className="chat-window__empty-icon"><Icon name="waving_hand" size="2rem" /></div>
                        <p>¡Dile hola!</p>
                    </div>
                ) : (
                    thread.map(msg => (
                        <article key={msg.id} className={`chat-window__bubble ${msg.sender_id === user?.user_id ? 'chat-window__bubble--sent' : 'chat-window__bubble--received'}`}>
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
                            placeholder="Escribe un mensaje aquí..."
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
                    >
                        {sending ? <div className="loading-spinner"></div> : <Icon name="send" size="1.1rem" />}
                    </Button>
                </form>
            </footer>
        </section>
    );
};

export default ChatWindow;
