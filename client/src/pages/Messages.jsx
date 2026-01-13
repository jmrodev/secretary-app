import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Messages = () => {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConvo, setSelectedConvo] = useState(null);
    const [thread, setThread] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Reply state
    const [messageText, setMessageText] = useState('');
    const scrollRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    useEffect(() => {
        loadConversations();
        loadUnreadCount();
        loadRecipients();

        // Polling for new messages every 10 seconds
        const interval = setInterval(() => {
            loadConversations();
            loadUnreadCount();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedConvo) {
            loadThread(selectedConvo.other_user_id);
            // Polling for the active thread every 5 seconds
            const threadInterval = setInterval(() => {
                loadThread(selectedConvo.other_user_id, true);
            }, 5000);
            return () => clearInterval(threadInterval);
        }
    }, [selectedConvo]);

    useEffect(() => {
        scrollToBottom();
    }, [thread]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    const loadConversations = async () => {
        try {
            const res = await axios.get(`${API_URL}/messages/conversations`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setConversations(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error loading conversations:', err);
        }
    };

    const loadThread = async (otherId, silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/messages/thread/${otherId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setThread(Array.isArray(res.data) ? res.data : []);
            if (selectedConvo && selectedConvo.unread_count > 0) {
                loadUnreadCount();
                loadConversations();
            }
        } catch (err) {
            console.error('Error loading thread:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadRecipients = async () => {
        try {
            const res = await axios.get(`${API_URL}/messages/recipients`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRecipients(res.data || []);
        } catch (err) {
            console.error('Error loading recipients:', err);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const res = await axios.get(`${API_URL}/messages/unread-count`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUnreadCount(res.data.unread_count);
        } catch (err) {
            console.error('Error loading unread count:', err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageText.trim() || !selectedConvo) return;

        setSending(true);
        try {
            await axios.post(`${API_URL}/messages`, {
                recipient_id: selectedConvo.other_user_id,
                recipient_type: 'individual',
                subject: selectedConvo.subject?.startsWith('Re:') ? selectedConvo.subject : `Re: ${selectedConvo.subject || ''}`,
                message: messageText
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setMessageText('');
            loadThread(selectedConvo.other_user_id, true);
            loadConversations();
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Error al enviar mensaje');
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
        // No need to close modal anymore
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="chat-container">
            <div className="chat-sidebar">
                <div className="sidebar-header" style={{ flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h2>Chat {unreadCount > 0 && <span className="convo-badge">{unreadCount}</span>}</h2>
                    </div>
                    <div className="search-wrapper" style={{ width: '100%' }}>
                        <input
                            type="text"
                            placeholder="Buscar chats o contactos..."
                            className="sidebar-search-input"
                            style={{
                                width: '100%',
                                padding: '10px 15px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                outline: 'none'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="conversations-list">
                    {(() => {
                        const q = searchTerm.toLowerCase().trim();

                        // Filter active conversations
                        const filteredConvos = conversations.filter(c =>
                            (c.other_display_name || c.other_username || '').toLowerCase().includes(q) ||
                            (c.message || '').toLowerCase().includes(q)
                        );

                        // If searching, also suggest recipients (staff) that are not in conversations
                        const existingUserIds = new Set(conversations.map(c => c.other_user_id));
                        const suggestedRecipients = recipients.filter(r =>
                            !existingUserIds.has(r.id) &&
                            (q.length === 0 || r.display_name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q))
                        );

                        if (filteredConvos.length === 0 && suggestedRecipients.length === 0) {
                            return (
                                <div className="chat-empty-view" style={{ background: 'transparent', height: 'auto' }}>
                                    <p>{q ? 'No se encontraron resultados' : 'No hay conversaciones'}</p>
                                </div>
                            );
                        }

                        return (
                            <>
                                {filteredConvos.map(convo => (
                                    <div
                                        key={`convo-${convo.id}`}
                                        className={`convo-item ${selectedConvo?.other_user_id === convo.other_user_id ? 'active' : ''} ${convo.unread_count > 0 ? 'unread' : ''}`}
                                        onClick={() => setSelectedConvo(convo)}
                                    >
                                        <div className="convo-avatar">
                                            {convo.other_display_name ? convo.other_display_name[0].toUpperCase() : '?'}
                                        </div>
                                        <div className="convo-info">
                                            <div className="convo-header-item">
                                                <span className="convo-name">{convo.other_display_name || convo.other_username}</span>
                                                <span className="convo-date">{formatDate(convo.created_at)}</span>
                                            </div>
                                            <div className="convo-last-msg">
                                                <span className="last-text">{convo.message}</span>
                                                {convo.unread_count > 0 && <span className="convo-badge">{convo.unread_count}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {suggestedRecipients.length > 0 && (
                                    <div style={{ padding: '10px', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        Contactos
                                    </div>
                                )}

                                {suggestedRecipients.map(r => (
                                    <div
                                        key={`recipient-${r.id}`}
                                        className={`convo-item`}
                                        onClick={() => startNewChat(r)}
                                    >
                                        <div className="convo-avatar" style={{ background: '#e2e8f0', color: '#475569', boxShadow: 'none' }}>
                                            {r.display_name[0].toUpperCase()}
                                        </div>
                                        <div className="convo-info">
                                            <div className="convo-header-item">
                                                <span className="convo-name">{r.display_name}</span>
                                                <span className="convo-date" style={{ fontSize: '0.7rem' }}>{r.role}</span>
                                            </div>
                                            <div className="convo-last-msg">
                                                <span className="last-text" style={{ fontStyle: 'italic' }}>Iniciar chat ahora</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        );
                    })()}
                </div>
            </div>

            <div className="chat-main">
                {selectedConvo ? (
                    <>
                        <div className="chat-header">
                            <div className="convo-avatar">
                                {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                            </div>
                            <div>
                                <h3>{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                                <small>{selectedConvo.subject || 'Conversación activa'}</small>
                            </div>
                        </div>

                        <div className="chat-messages" ref={scrollRef}>
                            {loading ? (
                                <div className="chat-empty-view">
                                    <p>Cargando mensajes...</p>
                                </div>
                            ) : thread.length === 0 ? (
                                <div className="chat-empty-view">
                                    <div className="empty-icon">👋</div>
                                    <p>¡Dile hola!</p>
                                </div>
                            ) : (
                                thread.map(msg => (
                                    <div key={msg.id} className={`message-bubble ${msg.sender_id === user?.user_id ? 'sent' : 'received'}`}>
                                        <div className="bubble-content">
                                            {msg.message}
                                            <span className="bubble-time">{formatDate(msg.created_at)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <div className="chat-input-wrapper">
                                <input
                                    type="text"
                                    placeholder="Escribe un mensaje aquí..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    disabled={sending}
                                />
                            </div>
                            <button type="submit" className="btn-send-chat" disabled={sending || !messageText.trim()}>
                                {sending ? '...' : '➤'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="chat-empty-view">
                        <div className="empty-icon">💬</div>
                        <h2>Tus Mensajes</h2>
                        <p>Selecciona una conversación para empezar a chatear o inicia un nuevo contacto.</p>
                        <button className="btn btn-primary" style={{ marginTop: '20px', borderRadius: '20px', padding: '10px 30px' }} onClick={() => setShowComposeModal(true)}>
                            Iniciar Nuevo Chat
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Messages;
