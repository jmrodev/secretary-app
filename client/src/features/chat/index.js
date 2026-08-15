
// Public API for the Chat Feature
// Real-time communications between users

// Controllers & Hooks
export { useFloatingChatController } from '@/features/chat/hooks/useFloatingChatController';
export { useMessagesPageController } from '@/features/chat/hooks/useMessagesPageController';

// Components
export { ChatPage } from '@/features/chat/ChatPage';
export { FloatingChat } from '@/features/chat/components/sections/FloatingChat';
export { ChatSidebar } from '@/features/chat/components/sections/ChatSidebar';
export { ChatWindow } from '@/features/chat/components/sections/ChatWindow';
export { ChatList } from '@/features/chat/components/ui/ChatList';
export { ChatConversationItem } from '@/features/chat/components/ui/ChatConversationItem';
export { ChatMessageBubble } from '@/features/chat/components/ui/ChatMessageBubble';
export { ChatThread } from '@/features/chat/components/sections/ChatThread';
export { WhatsAppModal } from '@/features/chat/components/ui/WhatsAppModal';
