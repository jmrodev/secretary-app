import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

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
            <div className="sidebar-header flex flex-col gap-4 p-4 border-b border-slate-100 bg-white">
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-xl font-bold text-slate-800">Chat {unreadCount > 0 && <span className="convo-badge ml-2">{unreadCount}</span>}</h2>
                </div>
                <div className="w-full relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder={t('search_chats_contacts') || "Buscar chats o contactos..."}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 transition-all outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="conversations-list overflow-y-auto custom-scrollbar h-full">
                {filteredConvos.length === 0 && suggestedRecipients.length === 0 && (
                    <div className="p-8 text-center text-slate-400 text-sm">
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
                    <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2 bg-slate-50">
                        {t('contacts') || 'Contactos'}
                    </div>
                )}

                {suggestedRecipients.map(r => (
                    <div
                        key={`recipient-${r.id}`}
                        className={`convo-item hover:bg-slate-50 cursor-pointer`}
                        onClick={() => onStartNewChat(r)}
                    >
                        <div className="convo-avatar bg-slate-200 text-slate-500 shadow-none">
                            {r.display_name[0].toUpperCase()}
                        </div>
                        <div className="convo-info">
                            <div className="convo-header-item">
                                <span className="convo-name text-slate-700">{r.display_name}</span>
                                <span className="convo-date text-xs text-slate-400 uppercase border border-slate-100 px-1 rounded">{r.role}</span>
                            </div>
                            <div className="convo-last-msg">
                                <span className="last-text italic text-slate-400 text-xs">{t('start_chat_now')}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSidebar;
