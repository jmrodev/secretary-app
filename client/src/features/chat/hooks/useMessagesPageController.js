import { useState, useEffect, useRef } from 'react';
import api from '@/api/axios';
import { useAuth } from '@/features/auth';
import { useMessage } from '@/context/MessageContext';

/**
 * Controller hook for the Messages full-page view.
 */
export const useMessagesPageController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();

    // State
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [thread, setThread] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageText, setMessageText] = useState('');

    const scrollRef = useRef(null);

    // Loaders
    const loadConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const res = await api.get('/messages/unread-count');
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Error loading unread count:', err);
        }
    };

    const loadRecipients = async () => {
        try {
            const res = await api.get('/messages/recipients');
            setRecipients(res.data || []);
        } catch (err) {
            console.error('Error loading recipients:', err);
        }
    };

    const loadThread = async (otherId, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get(`/messages/thread/${otherId}`);
            setThread(Array.isArray(res.data) ? res.data : []);
            const hasUnread = (Array.isArray(res.data) ? res.data : []).some(msg => msg.sender_id == otherId && msg.read_status < 2);
            if (hasUnread) {
                loadUnreadCount();
                loadConversations();
            }
        } catch (err) {
            console.error('Error loading thread:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadConversations();
        loadUnreadCount();
        loadRecipients();

        const interval = setInterval(() => {
            loadConversations();
            loadUnreadCount();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Thread polling
    useEffect(() => {
        if (selectedConvo) {
            loadThread(selectedConvo.other_user_id);
            const threadInterval = setInterval(() => {
                loadThread(selectedConvo.other_user_id, true);
            }, 5000);
            return () => clearInterval(threadInterval);
        }
    }, [selectedConvo]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thread]);

    // Actions
    const handleSendMessage = async (e) => {
        e.preventDefault();
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
            loadThread(selectedConvo.other_user_id, true);
            loadConversations();
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
            setThread([]);
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
