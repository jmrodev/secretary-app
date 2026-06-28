import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useFloatingChatController } from '@/features/chat/hooks/useFloatingChatController';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatTime } from '@/utils/core/dateUtils';

// Local Components
import ChatThread from '@/features/chat/components/sections/ChatThread';
import ChatList from '@/features/chat/components/ui/ChatList';

import styles from './FloatingChat.module.css';

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
    const formatMessageTime = (dateString = '') => {
        return formatTime(dateString);
    };

    /**
     * Renders WhatsApp-style read status ticks.
     */
    const renderTicks = (status) => {
        if (status === 0) return (
            <div className={`${styles.ticks}`}>
                <Icon name="check" size="0.75rem" className={`${styles.tickGrey}`} />
            </div>
        );
        if (status === 1) return (
            <div className={`${styles.ticks}`}>
                <Icon name="done_all" size="0.75rem" className={`${styles.tickGrey}`} />
            </div>
        );
        if (status === 2) return (
            <div className={`${styles.ticks}`}>
                <Icon name="done_all" size="0.75rem" className={`${styles.tickBlue}`} />
            </div>
        );
        return null;
    };

    if (!user || user.role === 'patient') return null;

    const baseClass = styles.root;

    return (
        <div className={baseClass}>
            {isOpen ? (
                <div className={`${baseClass}__window animate-fade-in`}>
                    <div 
                        className={`${baseClass}__header`} 
                        onClick={() => !selectedConvo && closeChat()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !selectedConvo) {
                                e.preventDefault();
                                closeChat();
                            }
                        }}
                    >
                        <h4 className={`${baseClass}__title`}>
                            {selectedConvo ? (
                                <span 
                                    className={`${baseClass}__back`} 
                                    onClick={(e) => { e.stopPropagation(); backToList(); }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            backToList();
                                        }
                                    }}
                                >
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
                                formatDate={formatMessageTime}
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
                <div 
                    className={`${baseClass}__minimized`} 
                    onClick={toggleChat}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleChat();
                        }
                    }}
                >
                    <Icon name="chat" size="1.1rem" />
                    <span>Mensajes</span>
                    {unreadCount > 0 && <span className={`${baseClass}__badge`}>{unreadCount}</span>}
                </div>
            )}
        </div>
    );
};

export default FloatingChat;
