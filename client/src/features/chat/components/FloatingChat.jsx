import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useFloatingChatController } from '../hooks/useFloatingChatController';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';

// Local Components
import ChatThread from './ChatThread';
import ChatList from './ChatList';

import './FloatingChat.css';

/**
 * FloatingChat Organism.
 * Minimized chat widget for quick messaging between users.
 * Orchestrates views between the conversation list and the active thread.
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

    /**
     * Helper to format timestamps for message bubbles.
     */
    const formatDate = (dateString = '') => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    /**
     * Renders WhatsApp-style read status ticks.
     */
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
                            <ChatThread
                                thread={thread}
                                user={user}
                                loading={loading}
                                sending={sending}
                                messageText={messageText}
                                isOtherTyping={isOtherTyping}
                                scrollRef={scrollRef}
                                formatDate={formatDate}
                                renderTicks={renderTicks}
                                handleTyping={handleTyping}
                                handleSendMessage={handleSendMessage}
                            />
                        ) : (
                            <ChatList
                                conversations={conversations}
                                recipients={recipients}
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                setSelectedConvo={setSelectedConvo}
                                startNewChat={startNewChat}
                            />
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
