
// Public API for the Chat Feature
// Real-time communications between users

// Controllers & Hooks
export { useFloatingChatController } from './hooks/useFloatingChatController';
export { useMessagesPageController } from './hooks/useMessagesPageController';

// Components
export { default as FloatingChat } from './components/FloatingChat';
export { default as ChatSidebar } from './components/ChatSidebar';
export { default as ChatWindow } from './components/ChatWindow';
export { default as ChatList } from './components/ChatList';
export { default as ChatConversationItem } from './components/ChatConversationItem';
export { default as ChatMessageBubble } from './components/ChatMessageBubble';
export { default as ChatThread } from './components/ChatThread';
