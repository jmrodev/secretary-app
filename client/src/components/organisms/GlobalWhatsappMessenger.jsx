import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import Icon from '@/components/atoms/Icon';
import WhatsappChatHistory from '@/features/patients/components/WhatsappChatHistory';
import { useLanguage } from '@/context/LanguageContext';
import './GlobalWhatsappMessenger.css';

const GlobalWhatsappMessenger = () => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && !selectedPatientId) {
            fetchConversations();
            
            const intervalId = setInterval(() => {
                api.get('/whatsapp/recent')
                   .then(res => {
                       if (res.data.success) {
                           setConversations(res.data.data);
                       }
                   }).catch(err => console.error("Auto-poll error", err));
            }, 3000);
            
            return () => clearInterval(intervalId);
        }
    }, [isOpen, selectedPatientId]);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/whatsapp/recent');
            if (res.data.success) {
                setConversations(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching recent conversations", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientClick = (patientId) => {
        setSelectedPatientId(patientId);
    };

    const handleBack = () => {
        setSelectedPatientId(null);
        fetchConversations();
    };

    const formatTime = (dateString) => {
        const d = new Date(dateString);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        
        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    };

    if (!isOpen) {
        return (
            <button className="global-wa-btn" onClick={() => setIsOpen(true)}>
                <Icon name="whatsapp" size="1.8rem" />
            </button>
        );
    }

    return (
        <aside className={`global-wa-messenger ${selectedPatientId ? 'global-wa-messenger--has-chat' : ''} animate-slideUp`}>
            {/* Sidebar: Conversations List */}
            <section className="global-wa-messenger__sidebar">
                <header className="global-wa-messenger__sidebar-header">
                    <div className="global-wa-messenger__title">
                        <Icon name="whatsapp" size="1.2rem" />
                        <h3>{t('chats') || 'Chats'}</h3>
                    </div>
                    <div className="global-wa-messenger__header-actions">
                        <button className="global-wa-messenger__action-btn-gray" onClick={fetchConversations} title={t('refresh')}>
                            <Icon name="refresh" size="1.1rem" />
                        </button>
                        <button className="global-wa-messenger__close-mobile" onClick={() => setIsOpen(false)}>
                            <Icon name="x" size="1.2rem" />
                        </button>
                    </div>
                </header>
                
                <div className="global-wa-messenger__inbox">
                    {loading && conversations.length === 0 ? (
                        <div className="global-wa-messenger__empty">{t('loading') || 'Cargando...'}</div>
                    ) : conversations.length === 0 ? (
                        <div className="global-wa-messenger__empty">{t('no_recent_chats') || 'Sin mensajes'}</div>
                    ) : (
                        <ul className="global-wa-messenger__list">
                            {conversations.map(conv => (
                                <li 
                                    key={conv.patient_id} 
                                    className={`global-wa-messenger__list-item ${selectedPatientId === conv.patient_id ? 'global-wa-messenger__list-item--active' : ''}`} 
                                    onClick={() => handlePatientClick(conv.patient_id)}
                                >
                                    <div className="global-wa-messenger__item-avatar">
                                        {(conv.patient_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="global-wa-messenger__item-info">
                                        <div className="global-wa-messenger__item-header">
                                            <strong>{conv.patient_name || conv.patient_phone || 'Desconocido'}</strong>
                                            <span className="global-wa-messenger__item-time">{formatTime(conv.created_at)}</span>
                                        </div>
                                        <p className="global-wa-messenger__item-body">
                                            {conv.direction === 'outbound' ? 'Tú: ' : ''}{conv.body}
                                        </p>
                                    </div>
                                    {conv.direction === 'inbound' && selectedPatientId !== conv.patient_id && (
                                        <div className="global-wa-messenger__unread-dot" title="Mensaje sin leer"></div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            {/* Main: Chat View */}
            <section className="global-wa-messenger__chat-area">
                <header className="global-wa-messenger__chat-header">
                    <div className="global-wa-messenger__header-left">
                        {selectedPatientId && (
                            <button className="global-wa-messenger__back-btn" onClick={handleBack}>
                                <Icon name="arrow_back" size="1.2rem" />
                            </button>
                        )}
                        <div className="global-wa-messenger__chat-user">
                            {selectedPatientId ? (
                                <>
                                    <strong>{conversations.find(c => c.patient_id === selectedPatientId)?.patient_name || 'Chat'}</strong>
                                    <span className="global-wa-messenger__online-status">En línea</span>
                                </>
                            ) : (
                                <div className="global-wa-messenger__chat-placeholder-header">
                                    {t('whatsapp_messenger') || 'WhatsApp Messenger'}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="global-wa-messenger__header-actions">
                        <button className="global-wa-messenger__action-btn global-wa-messenger__close-desktop" onClick={() => setIsOpen(false)}>
                            <Icon name="x" size="1.2rem" />
                        </button>
                    </div>
                </header>

                <div className="global-wa-messenger__chat-content">
                    {selectedPatientId ? (
                        <div className="global-wa-messenger__chat-wrapper">
                            <WhatsappChatHistory patientId={selectedPatientId} t={t} hideHeader={true} />
                        </div>
                    ) : (
                        <div className="global-wa-messenger__placeholder">
                            <div className="global-wa-messenger__placeholder-icon">
                                <Icon name="whatsapp" size="4rem" />
                            </div>
                            <h3>{t('select_chat_title') || 'Tus conversaciones'}</h3>
                            <p>{t('select_chat_desc') || 'Selecciona un paciente para ver el historial y enviar mensajes.'}</p>
                        </div>
                    )}
                </div>
            </section>
        </aside>
    );
};

export default GlobalWhatsappMessenger;
