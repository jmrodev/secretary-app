import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/api/axios';
import { useAuth } from '@/features/auth/AuthContext';
import { useMessage } from '@/context/MessageContext';
import { useFetch } from '@/hooks/useFetch';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * Controller hook for the Messages full-page view.
 */
export const useMessagesPageController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();

    // State
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageText, setMessageText] = useState('');
    const [bridgeStatus, setBridgeStatus] = useState({ status: 'connected', qr_code: '', session_expired_since: null });
    const [bridgeStatusLoading, setBridgeStatusLoading] = useState(true);
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

    const fetchBridgeStatus = useCallback(async (isAuto = false) => {
        if (!isAuto) setBridgeStatusLoading(true);
        try {
            const res = await api.get('/whatsapp/status');
            if (res.data.success) {
                setBridgeStatus({ status: res.data.status, qr_code: res.data.qr_code, session_expired_since: res.data.session_expired_since || null });
            }
        } catch (error) {
            console.error('[WhatsApp] Failed to fetch bridge status:', error);
            setBridgeStatus({ status: 'offline', qr_code: '', session_expired_since: null });
        } finally {
            setBridgeStatusLoading(false);
        }
    }, []);

    const handleRefreshBridge = useCallback(async () => {
        setBridgeStatusLoading(true);
        try {
            await api.post('/whatsapp/refresh');
            await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
            console.error('[WhatsApp] Failed to refresh bridge:', error);
        } finally {
            fetchBridgeStatus(true);
        }
    }, [fetchBridgeStatus]);

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

    useEffect(() => {
        fetchBridgeStatus();
        const bridgeInterval = setInterval(() => fetchBridgeStatus(true), 5000);
        return () => clearInterval(bridgeInterval);
    }, [fetchBridgeStatus]);

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
            showMessage(t('error_sending_message'), 'error');
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
                subject: t('new_message_subject')
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
        startNewChat,
        bridgeStatus,
        bridgeStatusLoading,
        fetchBridgeStatus,
        handleRefreshBridge
    };
};
