import React from 'react';
import { useMessagesPageController, ChatSidebar, ChatWindow } from '../features/chat';

/**
 * Messages Page.
 * Renders the full-screen chat experience using components and logic from the chat feature.
 */
const Messages = () => {
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
        <div className="chat-container app-layout h-screen overflow-hidden flex">
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
    );
};

export default Messages;
