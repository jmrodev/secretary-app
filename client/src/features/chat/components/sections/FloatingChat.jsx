import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useFloatingChatController } from '@/features/chat/hooks/useFloatingChatController';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatTime } from '@/utils/core/dateUtils';
import { useLanguage } from '@/hooks/useLanguage';

// Local Components
import { ChatThread } from '@/features/chat/components/sections/ChatThread';
import { ChatList } from '@/features/chat/components/ui/ChatList';

import styles from './FloatingChat.module.css';

const formatMessageTime = (dateString = '') => formatTime(dateString);

const renderTicks = (status) => {
    if (status === 0) return (
        <div className={`${styles.FloatingChat__ticks}`}>
            <Icon name="check" size="0.75rem" className={`${styles.FloatingChat__tickGrey}`} />
        </div>
    );
    if (status === 1) return (
        <div className={`${styles.FloatingChat__ticks}`}>
            <Icon name="done_all" size="0.75rem" className={`${styles.FloatingChat__tickGrey}`} />
        </div>
    );
    if (status === 2) return (
        <div className={`${styles.FloatingChat__ticks}`}>
            <Icon name="done_all" size="0.75rem" className={`${styles.FloatingChat__tickBlue}`} />
        </div>
    );
    return null;
};

/**
 * FloatingChat Organism.
 * Minimized chat widget for quick messaging between users.
 * Orchestrates views between the conversation list and the active thread.
 */
export const FloatingChat = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
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

    if (!user || user.role === 'patient') return null;

    const baseClass = styles.FloatingChat__root;

    return (
        <div className={baseClass}>
            {isOpen ? (
                <div className={`${baseClass}__window animate-fade-in`}>
                    <div 
                        className={`${baseClass}__header`}
                    >
                        <h4 className={`${baseClass}__title`}>
                            {selectedConvo ? (
                                <button
                                    type="button"
                                    className={`${baseClass}__back`}
                                    onClick={(e) => { e.stopPropagation(); backToList(); }}
                                >
                                    <Icon name="arrow_back" size="1.1rem" />
                                    {selectedConvo.other_display_name}
                                </button>
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
                <button
                    type="button"
                    className={`${baseClass}__minimized`}
                    onClick={toggleChat}
                >
                    <Icon name="chat" size="1.1rem" />
                    <span>{t('messages') || 'Mensajes'}</span>
                    {unreadCount > 0 && <span className={`${baseClass}__badge`}>{unreadCount}</span>}
                </button>
            )}
        </div>
    );
};
