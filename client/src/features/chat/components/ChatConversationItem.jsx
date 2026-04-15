import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

/**
 * ChatConversationItem Molecule (Feature Component).
 * Renders a single conversation or contact in the chat list.
 */
const ChatConversationItem = ({
    convo,
    isContact = false,
    onClick,
    unreadCount = 0
}) => {
    const { t } = useLanguage();
    const avatarChar = (convo.other_display_name || convo.display_name || '?')[0].toUpperCase();

    return (
        <article
            className={`floating-chat__item ${unreadCount > 0 ? 'floating-chat__item--unread' : ''}`}
            onClick={onClick}
        >
            <h4 className="visually-hidden">{t('conversation')}</h4>
            <div className={`floating-chat__avatar ${isContact ? 'floating-chat__avatar--contact' : ''}`}>
                {avatarChar}
            </div>
            <div className="floating-chat__item-info">
                <span className="floating-chat__item-name">
                    {convo.other_display_name || convo.display_name}
                </span>
                <span className={`floating-chat__item-last ${isContact ? 'floating-chat__item-last--contact' : ''}`}>
                    {isContact ? t('start_chat_now') : convo.message}
                </span>
            </div>
            {unreadCount > 0 && <span className="floating-chat__badge">{unreadCount}</span>}
        </article>
    );
};

export default ChatConversationItem;
