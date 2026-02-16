import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useFloatingChatController } from '../../controllers/useFloatingChatController';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Badge from '../atoms/Badge';
import './FloatingChat.css';

/**
 * FloatingChat Organism.
 * Minimized chat widget for quick messaging between users.
 */
const FloatingChat = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const {
        isOpen, toggleChat, closeChat,
        selectedConvo, setSelectedConvo, backToList,
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
        if (status === 0) return (
            <div className="floating-chat__ticks">
                <Icon name="check" size="0.75rem" className="floating-chat__tick--grey" />
            </div>
        );
        if (status === 1) return (
            <div className="floating-chat__ticks">
                <Icon name="done_all" size="0.75rem" className="floating-chat__tick--grey" />
            </div>
        );
        if (status === 2) return (
            <div className="floating-chat__ticks">
                <Icon name="done_all" size="0.75rem" className="floating-chat__tick--blue" />
            </div>
        );
        return null;
    };

    if (!user || user.role === 'patient') return null;

    const baseClass = 'floating-chat';

    return (
        <div className={baseClass}>
            {isOpen ? (
                <div className={`${baseClass}__window animate-fadeIn`}>
                    <div className={`${baseClass}__header`} onClick={() => !selectedConvo && closeChat()}>
                        <h4 className={`${baseClass}__title`}>
                            {selectedConvo ? (
                                <span className={`${baseClass}__back`} onClick={(e) => { e.stopPropagation(); backToList(); }}>
                                    <Icon name="arrow_back" size="1.1rem" />
                                    {selectedConvo.other_display_name}
                                </span>
                            ) : (
                                <>
                                    <Icon name="chat" size="1.1rem" />
                                    Mensajes
                                    {unreadCount > 0 && <span className={`${baseClass}__badge`}>{unreadCount}</span>}
                                </>
                            )}
                        </h4>
                        <div className={`${baseClass}__controls`}>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                onClick={closeChat}
                                icon={<Icon name="remove" size="1.1rem" />}
                            />
                        </div>
                    </div>

                    <div className={`${baseClass}__content`}>
                        {selectedConvo ? (
                            <>
                                <div className={`${baseClass}__messages`} ref={scrollRef}>
                                    {loading && thread.length === 0 ? (
                                        <p className="text-center p-4 text-muted">Cargando...</p>
                                    ) : (
                                        thread.map(msg => (
                                            <div
                                                key={msg.id}
                                                className={`${baseClass}__bubble ${msg.sender_id === user.user_id ? `${baseClass}__bubble--sent` : `${baseClass}__bubble--received`}`}
                                            >
                                                <div className={`${baseClass}__bubble-text`}>{msg.message}</div>
                                                <div className={`${baseClass}__bubble-footer`}>
                                                    <span className={`${baseClass}__time`}>{formatDate(msg.created_at)}</span>
                                                    {msg.sender_id === user.user_id && renderTicks(msg.read_status)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isOtherTyping && (
                                        <div className={`${baseClass}__bubble ${baseClass}__bubble--received typing-indicator`}>
                                            <em>Escribiendo...</em>
                                        </div>
                                    )}
                                </div>
                                <form className={`${baseClass}__input-area`} onSubmit={handleSendMessage}>
                                    <div className={`${baseClass}__input-wrapper`}>
                                        <Input
                                            placeholder="Responde aquí..."
                                            value={messageText}
                                            onChange={handleTyping}
                                            disabled={sending}
                                            size="sm"
                                            autoFocus
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={sending || !messageText.trim()}
                                        icon={<Icon name="send" size="1rem" />}
                                    />
                                </form>
                            </>
                        ) : (
                            <div className={`${baseClass}__list`}>
                                <div className={`${baseClass}__search`}>
                                    <Input
                                        placeholder="Buscar..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        size="sm"
                                        icon={<Icon name="search" size="1rem" />}
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
                                                    className={`${baseClass}__item ${convo.unread_count > 0 ? `${baseClass}__item--unread` : ''}`}
                                                    onClick={() => setSelectedConvo(convo)}
                                                >
                                                    <div className={`${baseClass}__avatar`}>
                                                        {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                                                    </div>
                                                    <div className={`${baseClass}__item-info`}>
                                                        <span className={`${baseClass}__item-name`}>{convo.other_display_name}</span>
                                                        <span className={`${baseClass}__item-last`}>{convo.message}</span>
                                                    </div>
                                                    {convo.unread_count > 0 && <span className={`${baseClass}__badge`}>{convo.unread_count}</span>}
                                                </div>
                                            ))}

                                            {suggestedRecipients.length > 0 && (
                                                <div className={`${baseClass}__section-title`}>
                                                    Contactos
                                                </div>
                                            )}

                                            {suggestedRecipients.map(r => (
                                                <div
                                                    key={`recipient-${r.id}`}
                                                    className={`${baseClass}__item`}
                                                    onClick={() => startNewChat(r)}
                                                >
                                                    <div className={`${baseClass}__avatar`} style={{ background: 'var(--gray-200)', color: 'var(--text-muted)' }}>
                                                        {r.display_name[0].toUpperCase()}
                                                    </div>
                                                    <div className={`${baseClass}__item-info`}>
                                                        <span className={`${baseClass}__item-name`}>{r.display_name}</span>
                                                        <span className={`${baseClass}__item-last`} style={{ fontStyle: 'italic' }}>Iniciar chat ahora</span>
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
                <div className={`${baseClass}__minimized`} onClick={toggleChat}>
                    <Icon name="chat" size="1.1rem" />
                    <span>Mensajes</span>
                    {unreadCount > 0 && <span className={`${baseClass}__badge`}>{unreadCount}</span>}
                </div>
            )}
        </div>
    );
};

export default FloatingChat;
