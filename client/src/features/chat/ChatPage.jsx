import React from 'react';
import { useMessagesPageController, ChatSidebar, ChatWindow } from './index';
import MainLayout from '../../components/templates/MainLayout';


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
        <MainLayout wide>
            <div className="chat-container app-layout h-screen overflow-hidden flex animate-fadeIn">
                <ChatSidebar
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
                    selectedConvo={selectedConvo}
                    thread={thread}
                    user={user}
                    loading={loading}
                    sending={sending}
                    messageText={messageText}
                    setMessageText={setMessageText}
                    onSendMessage={handleSendMessage}
                    scrollRef={scrollRef}
                />
            </div>
        </MainLayout>
    );

};

export default ChatPage;
