import { useState, useEffect, useRef } from 'react';
import { api } from '@/api/axios';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';
import { useFetch } from '@/hooks/useFetch';

/**
 * Controller hook for the Messages full-page view.
 */
export const useMessagesPageController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();

    // State
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageText, setMessageText] = useState('');
    const scrollRef = useRef(null);

    // --- Data Fetching using useFetch ---

    // Conversations
    const { 
        data: conversations = [], 
        refetch: fetchConversations 
    } = useFetch('/messages/conversations', { 
        initialData: [],
        immediate: true 
    });

    // Unread Count
    const { 
        data: unreadData = { unread_count: 0 }, 
        refetch: fetchUnreadCount 
    } = useFetch('/messages/unread-count', {
        initialData: { unread_count: 0 },
        immediate: true
    });
    const unreadCount = unreadData?.unread_count || 0;

    // Recipients
    const { data: recipients = [] } = useFetch('/messages/recipients', { 
        initialData: [],
        immediate: true 
    });

    // Selected Thread
    const { 
        data: thread = [], 
        loading, 
        refetch: fetchThread 
    } = useFetch(selectedConvo ? `/messages/thread/${selectedConvo.other_user_id}` : null, {
        initialData: [],
        onSuccess: (data) => {
            const hasUnread = data.some(msg => msg.sender_id == selectedConvo?.other_user_id && msg.read_status < 2);
            if (hasUnread) {
                fetchUnreadCount();
                fetchConversations();
            }
        }
    });

    // Polling Logic
    useEffect(() => {
        const interval = setInterval(() => {
            fetchConversations();
            fetchUnreadCount();
            if (selectedConvo) {
                fetchThread();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchConversations, fetchUnreadCount, fetchThread, selectedConvo]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thread]);

    // Actions
    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!messageText.trim() || !selectedConvo) return;

        setSending(true);
        try {
            await api.post('/messages', {
                recipient_id: selectedConvo.other_user_id,
                recipient_type: 'individual',
                subject: selectedConvo.subject?.startsWith('Re:') ? selectedConvo.subject : `Re: ${selectedConvo.subject || ''}`,
                message: messageText
            });

            setMessageText('');
            fetchThread();
            fetchConversations();
        } catch (err) {
            console.error('Error sending message:', err);
            showMessage('Error al enviar mensaje', 'error');
        } finally {
            setSending(false);
        }
    };

    const startNewChat = (recipient) => {
        const existing = conversations.find(c => c.other_user_id === recipient.id);
        if (existing) {
            setSelectedConvo(existing);
        } else {
            setSelectedConvo({
                other_user_id: recipient.id,
                other_display_name: recipient.display_name,
                subject: 'Nuevo Mensaje'
            });
        }
        setSearchTerm(''); // Clear search to show the chat
    };

    return {
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
    };
};
