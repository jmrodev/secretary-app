import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

/**
 * Controller hook for FloatingChat component.
 * Manages chat state, message loading, sending, and notifications.
 */
export const useFloatingChatController = (user, showMessage) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [thread, setThread] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [recipients, setRecipients] = useState([]);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    const scrollRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));

    const playNotification = useCallback((convo) => {
        notificationSound.current.play().catch(() => { });
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Mensaje de ${convo.other_display_name}`, {
                body: convo.message,
                icon: '/logo.png'
            });
        }
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const res = await api.get('/messages/conversations');
            const newData = Array.isArray(res.data) ? res.data : [];

            if (conversations.length > 0 && newData.length > 0) {
                const totalUnreadNew = newData.reduce((acc, c) => acc + (c.unread_count || 0), 0);
                const totalUnreadOld = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

                if (totalUnreadNew > totalUnreadOld) {
                    const latestMsg = newData.find(c => (c.unread_count || 0) > 0);
                    if (latestMsg && (!selectedConvo || selectedConvo.other_user_id !== latestMsg.other_user_id)) {
                        playNotification(latestMsg);
                    }
                }
            }
            setConversations(newData);
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    }, [conversations, selectedConvo, playNotification]);

    const loadThread = useCallback(async (otherId, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get(`/messages/thread/${otherId}`);
            setThread(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading thread:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    const loadUnreadCount = useCallback(async () => {
        try {
            const res = await api.get('/messages/unread-count');
            setUnreadCount(res.data.unread_count || 0);
        } catch (err) {
            console.error('Error loading unread count:', err);
        }
    }, []);

    const loadRecipients = useCallback(async () => {
        try {
            const res = await api.get('/messages/recipients');
            setRecipients(res.data || []);
        } catch (err) {
            console.error('Error loading recipients:', err);
        }
    }, []);

    const checkTypingStatus = useCallback(async (otherId) => {
        try {
            const res = await api.get(`/messages/typing/${otherId}`);
            setIsOtherTyping(res.data.is_typing);
        } catch (err) {
            console.error('Error checking typing status:', err);
        }
    }, []);

    const notifyTyping = useCallback(async () => {
        if (!selectedConvo) return;
        try {
            await api.post('/messages/typing', { target_id: selectedConvo.other_user_id });
        } catch (err) {
            console.error('Error notifying typing:', err);
        }
    }, [selectedConvo]);

    useEffect(() => {
        if (!user || user.role === 'patient') return;

        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission().then(permission => {
                setPermissionGranted(permission === "granted");
            });
        }

        loadConversations();
        loadUnreadCount();
        loadRecipients();

        const interval = setInterval(() => {
            loadConversations();
            loadUnreadCount();
        }, 15000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        if (selectedConvo) {
            loadThread(selectedConvo.other_user_id);
            const threadInterval = setInterval(() => {
                loadThread(selectedConvo.other_user_id, true);
                checkTypingStatus(selectedConvo.other_user_id);
            }, 5000);
            return () => clearInterval(threadInterval);
        }
    }, [selectedConvo, loadThread, checkTypingStatus]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thread]);

    const handleTyping = (e) => {
        setMessageText(e.target.value);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (!typingTimeoutRef.current) {
            notifyTyping();
            typingTimeoutRef.current = setTimeout(() => {
                typingTimeoutRef.current = null;
            }, 3000);
        }
    };

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
        setSearchTerm('');
    };

    const toggleChat = () => setIsOpen(prev => !prev);
    const closeChat = () => setIsOpen(false);
    const backToList = () => {
        setSelectedConvo(null);
        setThread([]);
        setIsOtherTyping(false);
    };

    return {
        isOpen, toggleChat, closeChat,
        selectedConvo, setSelectedConvo, backToList,
        conversations,
        thread,
        unreadCount,
        messageText, setMessageText,
        loading,
        sending,
        searchTerm, setSearchTerm,
        recipients,
        isOtherTyping,
        scrollRef,
        handleTyping,
        handleSendMessage,
        startNewChat
    };
};
