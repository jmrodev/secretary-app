import React from 'react';
import Button from '../atoms/Button';
import './ChatWindow.css';

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
            <div className="chat-main chat-main--empty">
                <div className="chat-main__empty-icon">💬</div>
                <h2 className="chat-main__empty-title">Tus Mensajes</h2>
                <p className="chat-main__empty-text">Selecciona una conversación de la lista para empezar a chatear o busca un contacto para iniciar un nuevo chat.</p>
            </div>
        );
    }

    return (
        <div className="chat-main">
            {/* Header */}
            <div className="chat-header">
                <div className="convo-avatar">
                    {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                </div>
                <div>
                    <h3 className="chat-header__title">{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                    <small className="chat-header__subtitle">{selectedConvo.subject || 'Conversación activa'}</small>
                </div>
            </div>

            {/* Messages Area */}
            <div className="chat-messages" ref={scrollRef}>
                {loading ? (
                    <div className="chat-messages--loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : thread.length === 0 ? (
                    <div className="chat-messages--empty">
                        <div className="chat-messages__empty-icon">👋</div>
                        <p>¡Dile hola!</p>
                    </div>
                ) : (
                    thread.map(msg => (
                        <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.user_id ? 'sent' : 'received'}`}>
                            <div className="bubble-content">
                                {msg.message}
                                <span className="bubble-time">{formatDate(msg.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <form className="chat-input-area" onSubmit={onSendMessage}>
                <div className="chat-input-wrapper">
                    <input
                        type="text"
                        placeholder="Escribe un mensaje aquí..."
                        className="chat-input"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={sending}
                    />
                </div>
                <Button
                    type="submit"
                    className="chat-send-button"
                    disabled={sending || !messageText.trim()}
                    variant="primary"
                >
                    {sending ? <div className="loading-spinner"></div> : '➤'}
                </Button>
            </form>
        </div>
    );
};

export default ChatWindow;
