import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import api from '../../api/axios';

const FloatingChat = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
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
    const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')); // Notification sound


    useEffect(() => {
        if (!user || user.role === 'patient') return;

        // Request notification permission
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
    }, [selectedConvo]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thread]);

    const loadConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            const newData = Array.isArray(res.data) ? res.data : [];

            // Check for new messages to notify
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
    };

    const playNotification = (convo) => {
        // Play sound
        notificationSound.current.play().catch(e => console.log('Sound blocked'));

        // Browser notification
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Mensaje de ${convo.other_display_name}`, {
                body: convo.message,
                icon: '/logo.png'
            });
        }
    };

    const loadThread = async (otherId, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await api.get(`/messages/thread/${otherId}`);
            setThread(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading thread:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const res = await api.get('/messages/unread-count');
            setUnreadCount(res.data.unread_count || 0);
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

    const checkTypingStatus = async (otherId) => {
        try {
            const res = await api.get(`/messages/typing/${otherId}`);
            setIsOtherTyping(res.data.is_typing);
        } catch (err) {
            console.error('Error checking typing status:', err);
        }
    };

    const notifyTyping = async () => {
        if (!selectedConvo) return;
        try {
            await api.post('/messages/typing', { target_id: selectedConvo.other_user_id });
        } catch (err) {
            console.error('Error notifying typing:', err);
        }
    };

    const handleTyping = (e) => {
        setMessageText(e.target.value);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Notify once every 3 seconds while typing
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

    const formatDate = (dateString = '') => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    };

    const renderTicks = (status) => {
        if (status === 0) return <span className="tick-grey">✓</span>;
        if (status === 1) return <span className="tick-grey">✓✓</span>;
        if (status === 2) return <span className="tick-blue">✓✓</span>;
        return null;
    };

    if (!user || user.role === 'patient') return null;

    return (
        <div className="floating-chat-container">
            {isOpen ? (
                <div className="chat-widget-window">
                    <div className="widget-header" onClick={() => !selectedConvo && setIsOpen(false)}>
                        <h4>
                            {selectedConvo ? (
                                <span onClick={(e) => { e.stopPropagation(); setSelectedConvo(null); setThread([]); setIsOtherTyping(false); }}>
                                    ⬅️ {selectedConvo.other_display_name}
                                </span>
                            ) : (
                                <>💬 Mensajes {unreadCount > 0 && <span className="widget-badge">{unreadCount}</span>}</>
                            )}
                        </h4>
                        <div className="widget-controls">
                            <button className="control-btn" onClick={() => setIsOpen(false)}>➖</button>
                        </div>
                    </div>

                    <div className="widget-content">
                        {selectedConvo ? (
                            <>
                                <div className="widget-chat-messages" ref={scrollRef}>
                                    {loading && thread.length === 0 ? <p className="text-center p-4 text-muted">Cargando...</p> :
                                        thread.map(msg => (
                                            <div key={msg.id} className={`widget-bubble ${msg.sender_id === user.user_id ? 'sent' : 'received'}`}>
                                                <div className="bubble-text">{msg.message}</div>
                                                <div className="bubble-footer">
                                                    <span className="widget-time">{formatDate(msg.created_at)}</span>
                                                    {msg.sender_id === user.user_id && renderTicks(msg.read_status)}
                                                </div>
                                            </div>
                                        ))}
                                    {isOtherTyping && (
                                        <div className="widget-bubble received typing-indicator">
                                            <em>Escribiendo...</em>
                                        </div>
                                    )}
                                </div>
                                <form className="widget-input-area" onSubmit={handleSendMessage}>
                                    <div className="widget-input-wrapper">
                                        <input
                                            type="text"
                                            placeholder="Responde aquí..."
                                            value={messageText}
                                            onChange={handleTyping}
                                            disabled={sending}
                                            autoFocus
                                        />
                                    </div>
                                    <button type="submit" className="widget-send-btn" disabled={sending || !messageText.trim()}>
                                        {sending ? '...' : '➤'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="widget-convo-list">
                                <div style={{ padding: '8px 12px', borderBottom: '1px solid #edf2f7' }}>
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        style={{
                                            width: '100%',
                                            padding: '6px 12px',
                                            borderRadius: '15px',
                                            border: '1px solid #e2e8f0',
                                            fontSize: '0.85rem',
                                            outline: 'none',
                                            background: '#f8fafc'
                                        }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                {(() => {
                                    const q = searchTerm.toLowerCase().trim();
                                    const filteredConvos = conversations.filter(c =>
                                        (c.other_display_name || '').toLowerCase().includes(q) ||
                                        (c.message || '').toLowerCase().includes(q) ||
                                        (c.other_phone || '').includes(q)
                                    );

                                    const existingUserIds = new Set(conversations.map(c => c.other_user_id));
                                    const suggestedRecipients = recipients.filter(r =>
                                        !existingUserIds.has(r.id) &&
                                        (q.length === 0 || r.display_name.toLowerCase().includes(q))
                                    );

                                    if (filteredConvos.length === 0 && suggestedRecipients.length === 0) {
                                        return <p className="text-center text-muted p-4" style={{ fontSize: '0.85rem' }}>No se encontraron resultados</p>;
                                    }

                                    return (
                                        <>
                                            {filteredConvos.map(convo => (
                                                <div
                                                    key={`convo-${convo.id}`}
                                                    className={`widget-convo-item ${convo.unread_count > 0 ? 'unread' : ''}`}
                                                    onClick={() => setSelectedConvo(convo)}
                                                >
                                                    <div className="widget-avatar">
                                                        {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                                                    </div>
                                                    <div className="widget-convo-info">
                                                        <span className="widget-convo-name">{convo.other_display_name}</span>
                                                        <span className="widget-convo-last">{convo.message}</span>
                                                    </div>
                                                    {convo.unread_count > 0 && <span className="widget-badge">{convo.unread_count}</span>}
                                                </div>
                                            ))}

                                            {suggestedRecipients.length > 0 && (
                                                <div style={{ padding: '8px 16px', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', background: '#f8fafc' }}>
                                                    Contactos
                                                </div>
                                            )}

                                            {suggestedRecipients.map(r => (
                                                <div
                                                    key={`recipient-${r.id}`}
                                                    className="widget-convo-item"
                                                    onClick={() => startNewChat(r)}
                                                >
                                                    <div className="widget-avatar" style={{ background: '#e2e8f0', color: '#64748b' }}>
                                                        {r.display_name[0].toUpperCase()}
                                                    </div>
                                                    <div className="widget-convo-info">
                                                        <span className="widget-convo-name">{r.display_name}</span>
                                                        <span className="widget-convo-last" style={{ fontStyle: 'italic' }}>Iniciar chat ahora</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="widget-minimized" onClick={() => setIsOpen(true)}>
                    <span>💬 Mensajes</span>
                    {unreadCount > 0 && <span className="widget-badge">{unreadCount}</span>}
                </div>
            )}
        </div>
    );
};

export default FloatingChat;
