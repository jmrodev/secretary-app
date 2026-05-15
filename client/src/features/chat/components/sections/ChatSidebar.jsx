import React from 'react';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { parseDate, isToday, formatTime, formatDate as formatUtil } from '@/utils/core/dateUtils';

/**
 * ChatSidebar Component (Feature Component).
 * Renders the sidebar for the full-screen chat page.
 */
const ChatSidebar = ({
    conversations,
    selectedConvo,
    onSelectConvo,
    searchTerm,
    setSearchTerm,
    recipients,
    onStartNewChat,
    unreadCount
}) => {
    const { t } = useLanguage();

    // Formatting Helpers
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = parseDate(dateString);
        return isToday(date)
            ? formatTime(date, { hour12: false })
            : formatUtil(date, { hideYear: true });
    };

    const q = searchTerm.toLowerCase().trim();

    // Filter active conversations
    const filteredConvos = conversations.filter(c =>
        (c.other_display_name || c.other_username || '').toLowerCase().includes(q) ||
        (c.message || '').toLowerCase().includes(q) ||
        (c.other_phone || '').includes(q)
    );

    // If searching, also suggest recipients (staff) that are not in conversations
    const existingUserIds = new Set(conversations.map(c => c.other_user_id));
    const suggestedRecipients = recipients.filter(r =>
        !existingUserIds.has(r.id) &&
        (q.length === 0 || r.display_name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q))
    );

    return (
        <div className="chat-sidebar">
            <div className="chat-sidebar__header">
                <div className="chat-sidebar__title-row">
                    <h2 className="chat-sidebar__title">
                        Chat {unreadCount > 0 && <span className="chat-sidebar__badge">{unreadCount}</span>}
                    </h2>
                </div>
                <div className="chat-sidebar__search-wrapper">
                    <span className="chat-sidebar__search-icon"><Icon name="search" /></span>
                    <input
                        type="text"
                        placeholder={t('search_chats_contacts') || "Buscar chats o contactos..."}
                        className="chat-sidebar__search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="chat-sidebar__list custom-scrollbar" role="listbox" aria-label={t('conversations_list')}>
                {filteredConvos.length === 0 && suggestedRecipients.length === 0 && (
                    <div className="chat-sidebar__empty">
                        <p>{q ? t('no_results_found') : t('no_conversations')}</p>
                    </div>
                )}

                {filteredConvos.map(convo => (
                    <div
                        key={`convo-${convo.id}`}
                        className={`chat-sidebar__convo-item ${selectedConvo?.other_user_id === convo.other_user_id ? 'chat-sidebar__convo-item--active' : ''} ${convo.unread_count > 0 ? 'chat-sidebar__convo-item--unread' : ''}`}
                        onClick={() => onSelectConvo(convo)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectConvo(convo)}
                        role="option"
                        aria-selected={selectedConvo?.other_user_id === convo.other_user_id}
                        tabIndex={0}
                    >
                        <div className="chat-sidebar__convo-avatar">
                            {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                        </div>
                        <div className="chat-sidebar__convo-info">
                            <div className="chat-sidebar__convo-header">
                                <span className="chat-sidebar__convo-name">{convo.other_display_name || convo.other_username}</span>
                                <span className="chat-sidebar__convo-date">{formatDate(convo.created_at)}</span>
                            </div>
                            <div className="chat-sidebar__convo-last-msg">
                                <span className="chat-sidebar__convo-text">{convo.message}</span>
                                {convo.unread_count > 0 && <span className="chat-sidebar__badge">{convo.unread_count}</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {suggestedRecipients.length > 0 && (
                    <div className="chat-sidebar__section-label">
                        {t('contacts') || 'Contactos'}
                    </div>
                )}

                {suggestedRecipients.map(r => (
                    <div
                        key={`recipient-${r.id}`}
                        className="chat-sidebar__convo-item"
                        onClick={() => onStartNewChat(r)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onStartNewChat(r)}
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                    >
                        <div className="chat-sidebar__convo-avatar">
                            {r.display_name[0].toUpperCase()}
                        </div>
                        <div className="chat-sidebar__convo-info">
                            <div className="chat-sidebar__convo-header">
                                <span className="chat-sidebar__convo-name">{r.display_name}</span>
                                <span className="chat-sidebar__recipient-role">{r.role}</span>
                            </div>
                            <div className="chat-sidebar__convo-last-msg">
                                <span className="chat-sidebar__recipient-hint">{t('start_chat_now') || 'Iniciar chat'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;
