
// Public API for the Chat Feature
// Real-time communications between users

// Controllers & Hooks
export { useFloatingChatController } from '@/features/chat/hooks/useFloatingChatController';
export { useMessagesPageController } from '@/features/chat/hooks/useMessagesPageController';

// Components
export { default as ChatPage } from '@/features/chat/ChatPage';
export { default as FloatingChat } from '@/features/chat/components/FloatingChat';
export { default as ChatSidebar } from '@/features/chat/components/ChatSidebar';
export { default as ChatWindow } from '@/features/chat/components/ChatWindow';
export { default as ChatList } from '@/features/chat/components/ChatList';
export { default as ChatConversationItem } from '@/features/chat/components/ChatConversationItem';
export { default as ChatMessageBubble } from '@/features/chat/components/ChatMessageBubble';
export { default as ChatThread } from '@/features/chat/components/ChatThread';
export { default as WhatsAppModal } from '@/features/chat/components/WhatsAppModal';
