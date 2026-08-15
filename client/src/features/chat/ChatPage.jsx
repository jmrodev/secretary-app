import React from 'react';
import { useMessagesPageController, ChatSidebar, ChatWindow } from '@/features/chat/index';
import { MainLayout } from '@/components/templates/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './ChatPage.module.css';


/**
 * ChatPage (Orchestrator).
 * Full-screen chat experience for staff and admins.
 */
export const ChatPage = () => {
    const { t } = useLanguage();
    const {
        user,
        conversations,
        selectedConvo, setSelectedConvo,
        thread,
        recipients,
        unreadCount,
        loading,
        sending,
        searchTerm, setSearchTerm,
        messageText, setMessageText,
        scrollRef,
        handleSendMessage,
        startNewChat
    } = useMessagesPageController();

    return (
        <MainLayout wide flush title={t('whatsapp_history')}>
            <section className={`${selectedConvo ? styles.ConvoSelected : ''} `}>
                <div>
                    <div className="chat-page-container">
                        <ChatSidebar
                            className={`${styles.ChatPage__chatSidebar}`}
                            conversations={conversations}
                            selectedConvo={selectedConvo}
                            onSelectConvo={setSelectedConvo}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            recipients={recipients}
                            onStartNewChat={startNewChat}
                            unreadCount={unreadCount}
                        />

                        <ChatWindow
                            className={`${styles.ChatPage__chatWindow}`}
                            selectedConvo={selectedConvo}
                            thread={thread}
                            user={user}
                            loading={loading}
                            sending={sending}
                            messageText={messageText}
                            setMessageText={setMessageText}
                            onSendMessage={handleSendMessage}
                            scrollRef={scrollRef}
                            onBack={() => setSelectedConvo(null)} // Call setSelectedConvo(null) to go back
                        />
                    </div>
                </div>
            </section>
        </MainLayout>
    );

};
