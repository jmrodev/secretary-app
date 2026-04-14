import React from 'react';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/context/LanguageContext';
import './ChatSidebar.css';

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
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        return isToday
            ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
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
                        {t('chat') || 'Chat'}
                        {unreadCount > 0 && <span className="convo-badge">{unreadCount}</span>}
                    </h2>
                </div>
                <div className="chat-sidebar__search-wrapper">
                    <Icon name="search" className="chat-sidebar__search-icon" />
                    <Input
                        type="text"
                        placeholder={t('search_chats_contacts') || 'Buscar chats o contactos...'}
                        className="chat-sidebar__search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="chat-sidebar__list custom-scrollbar">
                {filteredConvos.length === 0 && suggestedRecipients.length === 0 && (
                    <div className="chat-sidebar__empty">
                        <p>{q ? t('no_results_found') : t('no_conversations')}</p>
                    </div>
                )}

                {filteredConvos.map(convo => (
                    <div
                        key={`convo-${convo.id}`}
                        className={`convo-item ${selectedConvo?.other_user_id === convo.other_user_id ? 'active' : ''} ${convo.unread_count > 0 ? 'unread' : ''}`}
                        onClick={() => onSelectConvo(convo)}
                    >
                        <div className="convo-avatar">
                            {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                        </div>
                        <div className="convo-info">
                            <div className="convo-header-item">
                                <span className="convo-name">{convo.other_display_name || convo.other_username}</span>
                                <span className="convo-date">{formatDate(convo.created_at)}</span>
                            </div>
                            <div className="convo-last-msg">
                                <span className="last-text">{convo.message}</span>
                                {convo.unread_count > 0 && <span className="convo-badge">{convo.unread_count}</span>}
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
                        className="convo-item chat-sidebar__recipient"
                        onClick={() => onStartNewChat(r)}
                    >
                        <div className="convo-avatar chat-sidebar__recipient-avatar">
                            {r.display_name[0].toUpperCase()}
                        </div>
                        <div className="convo-info">
                            <div className="convo-header-item">
                                <span className="convo-name">{r.display_name}</span>
                                <span className="chat-sidebar__recipient-role">{r.role}</span>
                            </div>
                            <div className="convo-last-msg">
                                <span className="chat-sidebar__recipient-hint">{t('start_chat_now')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;
