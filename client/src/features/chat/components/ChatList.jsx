import React from 'react';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import ChatConversationItem from '@/features/chat/components/ChatConversationItem';

/**
 * ChatList Molecule (Feature Component).
 * Renders the searchable list of conversations and potential recipients.
 */
const ChatList = ({
    conversations,
    recipients,
    searchTerm,
    setSearchTerm,
    setSelectedConvo,
    startNewChat
}) => {
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

    return (
        <div className="floating-chat__list">
            <div className="floating-chat__search">
                <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                    icon={<Icon name="search" size="1rem" />}
                />
            </div>

            {filteredConvos.length === 0 && suggestedRecipients.length === 0 ? (
                <p className="text-center text-muted p-4" style={{ fontSize: '0.85rem' }}>
                    No se encontraron resultados
                </p>
            ) : (
                <>
                    {filteredConvos.map(convo => (
                        <ChatConversationItem
                            key={`convo-${convo.id}`}
                            convo={convo}
                            unreadCount={convo.unread_count}
                            onClick={() => setSelectedConvo(convo)}
                        />
                    ))}

                    {suggestedRecipients.length > 0 && (
                        <div className="floating-chat__section-title">
                            Contactos
                        </div>
                    )}

                    {suggestedRecipients.map(r => (
                        <ChatConversationItem
                            key={`recipient-${r.id}`}
                            convo={r}
                            isContact={true}
                            onClick={() => startNewChat(r)}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default ChatList;
