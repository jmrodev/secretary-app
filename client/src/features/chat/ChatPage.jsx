import React from 'react';
import { useMessagesPageController, ChatSidebar, ChatWindow } from '@/features/chat/index';
import MainLayout from '@/components/templates/MainLayout';
import './ChatPage.css';


/**
 * ChatPage (Orchestrator).
 * Full-screen chat experience for staff and admins.
 */
const ChatPage = () => {
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
        <MainLayout wide flush>
            <main className={`chat-page-orchestrator ${selectedConvo ? 'chat-page-orchestrator--convo-selected' : ''} animate-fade-in`}>
                <div className="layout-content-area">
                    <div className="chat-page-container">
                        <ChatSidebar
                            className="chat-sidebar"
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
                            className="chat-window"
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
            </main>
        </MainLayout>
    );

};

export default ChatPage;
