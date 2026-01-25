import React from 'react';
import { useMessagesPageController } from '../controllers/useMessagesPageController';
import ChatSidebar from '../components/organisms/ChatSidebar';
import ChatWindow from '../components/organisms/ChatWindow';

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
            {/* We override app-layout styles to fit full screen chat if needed, 
                but assuming app-layout usually has sidebar.
                If this page needs to act as a standalone layout or inside main layout:
                The CSS for .chat-container usually handles grid.
                Let's assume we want valid semantic structure but keep it simple.
            */}

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
