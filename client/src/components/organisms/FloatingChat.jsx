import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useFloatingChatController } from '../../controllers/useFloatingChatController';

const FloatingChat = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const {
        isOpen, toggleChat, closeChat,
        selectedConvo, backToList,
        conversations,
        thread,
        unreadCount,
        messageText,
        loading,
        sending,
        searchTerm, setSearchTerm,
        recipients,
        isOtherTyping,
        scrollRef,
        handleTyping,
        handleSendMessage,
        startNewChat
    } = useFloatingChatController(user, showMessage);

    const formatDate = (dateString = '') => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderTicks = (status) => {
        if (status === 0) return <span className="tick-grey">✓</span>;
        if (status === 1) return <span className="tick-grey">✓✓</span>;
        if (status === 2) return <span className="tick-blue">✓✓</span>;
        return null;
    };

    if (!user || user.role === 'patient') return null;

    return (
        <div className="floating-chat-container">
            {isOpen ? (
                <div className="chat-widget-window">
                    <div className="widget-header" onClick={() => !selectedConvo && closeChat()}>
                        <h4>
                            {selectedConvo ? (
                                <span onClick={(e) => { e.stopPropagation(); backToList(); }}>
                                    ⬅️ {selectedConvo.other_display_name}
                                </span>
                            ) : (
                                <>💬 Mensajes {unreadCount > 0 && <span className="widget-badge">{unreadCount}</span>}</>
                            )}
                        </h4>
                        <div className="widget-controls">
                            <button className="control-btn" onClick={closeChat}>➖</button>
                        </div>
                    </div>

                    <div className="widget-content">
                        {selectedConvo ? (
                            <>
                                <div className="widget-chat-messages" ref={scrollRef}>
                                    {loading && thread.length === 0 ? <p className="text-center p-4 text-muted">Cargando...</p> :
                                        thread.map(msg => (
                                            <div key={msg.id} className={`widget-bubble ${msg.sender_id === user.user_id ? 'sent' : 'received'}`}>
                                                <div className="bubble-text">{msg.message}</div>
                                                <div className="bubble-footer">
                                                    <span className="widget-time">{formatDate(msg.created_at)}</span>
                                                    {msg.sender_id === user.user_id && renderTicks(msg.read_status)}
                                                </div>
                                            </div>
                                        ))}
                                    {isOtherTyping && (
                                        <div className="widget-bubble received typing-indicator">
                                            <em>Escribiendo...</em>
                                        </div>
                                    )}
                                </div>
                                <form className="widget-input-area" onSubmit={handleSendMessage}>
                                    <div className="widget-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Responde aquí..."
                                            value={messageText}
                                            onChange={handleTyping}
                                            disabled={sending}
                                            autoFocus
                                        />
                                    </div>
                                    <button type="submit" className="widget-send-btn" disabled={sending || !messageText.trim()}>
                                        {sending ? '...' : '➤'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="widget-convo-list">
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #edf2f7' }}>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        style={{
                                            width: '100%',
                                            padding: '6px 12px',
                                            borderRadius: '15px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            background: '#f8fafc'
                                        }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {(() => {
                                    const q = searchTerm.toLowerCase().trim();
                                    const filteredConvos = conversations.filter(c =>
                                        (c.other_display_name || '').toLowerCase().includes(q) ||
                                        (c.message || '').toLowerCase().includes(q) ||
                                        (c.other_phone || '').includes(q)
                                    );

                                    const existingUserIds = new Set(conversations.map(c => c.other_user_id));
                                    const suggestedRecipients = recipients.filter(r =>
                                        !existingUserIds.has(r.id) &&
                                        (q.length === 0 || r.display_name.toLowerCase().includes(q))
                                    );

                                    if (filteredConvos.length === 0 && suggestedRecipients.length === 0) {
                                        return <p className="text-center text-muted p-4" style={{ fontSize: '0.85rem' }}>No se encontraron resultados</p>;
                                    }

                                    return (
                                        <>
                                            {filteredConvos.map(convo => (
                                                <div
                                                    key={`convo-${convo.id}`}
                                                    className={`widget-convo-item ${convo.unread_count > 0 ? 'unread' : ''}`}
                                                    onClick={() => setSelectedConvo(convo)}
                                                >
                                                    <div className="widget-avatar">
                                                        {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                                                    </div>
                                                    <div className="widget-convo-info">
                                                        <span className="widget-convo-name">{convo.other_display_name}</span>
                                                        <span className="widget-convo-last">{convo.message}</span>
                                                    </div>
                                                    {convo.unread_count > 0 && <span className="widget-badge">{convo.unread_count}</span>}
                                                </div>
                                            ))}

                                            {suggestedRecipients.length > 0 && (
                                                <div style={{ padding: '8px 16px', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', background: '#f8fafc' }}>
                                                    Contactos
                                                </div>
                                            )}

                                            {suggestedRecipients.map(r => (
                                                <div
                                                    key={`recipient-${r.id}`}
                                                    className="widget-convo-item"
                                                    onClick={() => startNewChat(r)}
                                                >
                                                    <div className="widget-avatar" style={{ background: '#e2e8f0', color: '#64748b' }}>
                                                        {r.display_name[0].toUpperCase()}
                                                    </div>
                                                    <div className="widget-convo-info">
                                                        <span className="widget-convo-name">{r.display_name}</span>
                                                        <span className="widget-convo-last" style={{ fontStyle: 'italic' }}>Iniciar chat ahora</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="widget-minimized" onClick={toggleChat}>
                    <span>💬 Mensajes</span>
                    {unreadCount > 0 && <span className="widget-badge">{unreadCount}</span>}
                </div>
            )}
        </div>
    );
};

export default FloatingChat;
