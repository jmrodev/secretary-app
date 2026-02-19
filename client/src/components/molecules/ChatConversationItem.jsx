import React from 'react';

/**
 * ChatConversationItem Molecule.
 * Renders a single conversation or contact in the chat list.
 */
const ChatConversationItem = ({
    convo,
    isContact = false,
    onClick,
    unreadCount = 0
}) => {
    const avatarChar = (convo.other_display_name || convo.display_name || '?')[0].toUpperCase();

    return (
        <div
            className={`floating-chat__item ${unreadCount > 0 ? 'floating-chat__item--unread' : ''}`}
            onClick={onClick}
        >
            <div className={`floating-chat__avatar`} style={isContact ? { background: 'var(--gray-200)', color: 'var(--text-muted)' } : {}}>
                {avatarChar}
            </div>
            <div className="floating-chat__item-info">
                <span className="floating-chat__item-name">
                    {convo.other_display_name || convo.display_name}
                </span>
                <span className="floating-chat__item-last" style={isContact ? { fontStyle: 'italic' } : {}}>
                    {isContact ? 'Iniciar chat ahora' : convo.message}
                </span>
            </div>
            {unreadCount > 0 && <span className="floating-chat__badge">{unreadCount}</span>}
        </div>
    );
};

export default ChatConversationItem;
