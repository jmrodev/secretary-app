import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { parseDate, isToday, formatTime, formatDate as formatUtil } from '@/utils/core/dateUtils';
import styles from './ChatSidebar.module.css';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = parseDate(dateString);
    return isToday(date)
        ? formatTime(date, { hour12: false })
        : formatUtil(date, { hideYear: true });
};

/**
 * ChatSidebar Component (Feature Component).
 * Renders the sidebar for the full-screen chat page.
 */
export const ChatSidebar = ({
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
        <div className={`${styles.ChatSidebar__root}`}>
            <div className={`${styles.ChatSidebar__header}`}>
                <div className={`${styles.ChatSidebar__titleRow}`}>
                    <h2 className={`${styles.ChatSidebar__title}`}>
                        Chat {unreadCount > 0 && <span className={`${styles.ChatSidebar__badge}`}>{unreadCount}</span>}
                    </h2>
                </div>
                <div className={`${styles.ChatSidebar__searchWrapper}`}>
                    <span className={`${styles.ChatSidebar__searchIcon}`}><Icon name="search" /></span>
                    <input
                        type="text"
                        placeholder={t('search_chats_contacts') || "Buscar chats o contactos..."}
                        className={`${styles.ChatSidebar__searchInput}`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={`${styles.ChatSidebar__list} custom-scrollbar`} role="listbox" aria-label={t('conversations_list')}>
                {filteredConvos.length === 0 && suggestedRecipients.length === 0 && (
                    <div className={`${styles.ChatSidebar__empty}`}>
                        <p>{q ? t('no_results_found') : t('no_conversations')}</p>
                    </div>
                )}

                {filteredConvos.map(convo => (
                    <div
                        key={`convo-${convo.id}`}
                        className={`${styles.ChatSidebar__convoItem} ${selectedConvo?.other_user_id === convo.other_user_id ? styles.ChatSidebar__convoItemActive : ''} ${convo.unread_count > 0 ? styles.ChatSidebar__convoItemUnread : ''}`}
                        onClick={() => onSelectConvo(convo)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectConvo(convo)}
                        role="option"
                        aria-selected={selectedConvo?.other_user_id === convo.other_user_id}
                        tabIndex={0}
                    >
                        <div className={`${styles.ChatSidebar__convoAvatar}`}>
                            {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                        </div>
                        <div className={`${styles.ChatSidebar__convoInfo}`}>
                            <div className={`${styles.ChatSidebar__convoHeader}`}>
                                <span className={`${styles.ChatSidebar__convoName}`}>{convo.other_display_name || convo.other_username}</span>
                                <span className={`${styles.ChatSidebar__convoDate}`}>{formatDate(convo.created_at)}</span>
                            </div>
                            <div className={`${styles.ChatSidebar__convoLastMsg}`}>
                                <span className={`${styles.ChatSidebar__convoText}`}>{convo.message}</span>
                                {convo.unread_count > 0 && <span className={`${styles.ChatSidebar__badge}`}>{convo.unread_count}</span>}
                            </div>
                        </div>
                    </div>
                ))}

                {suggestedRecipients.length > 0 && (
                    <div className={`${styles.ChatSidebar__sectionLabel}`}>
                        {t('contacts') || 'Contactos'}
                    </div>
                )}

                {suggestedRecipients.map(r => (
                    <div
                        key={`recipient-${r.id}`}
                        className={`${styles.ChatSidebar__convoItem}`}
                        onClick={() => onStartNewChat(r)}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onStartNewChat(r)}
                        role="option"
                        aria-selected={false}
                        tabIndex={0}
                    >
                        <div className={`${styles.ChatSidebar__convoAvatar}`}>
                            {r.display_name[0].toUpperCase()}
                        </div>
                        <div className={`${styles.ChatSidebar__convoInfo}`}>
                            <div className={`${styles.ChatSidebar__convoHeader}`}>
                                <span className={`${styles.ChatSidebar__convoName}`}>{r.display_name}</span>
                                <span className={`${styles.ChatSidebar__recipientRole}`}>{r.role}</span>
                            </div>
                            <div className={`${styles.ChatSidebar__convoLastMsg}`}>
                                <span className={`${styles.ChatSidebar__recipientHint}`}>{t('start_chat_now') || 'Iniciar chat'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
