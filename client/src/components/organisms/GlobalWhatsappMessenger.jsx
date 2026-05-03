import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '@/api/axios';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import WhatsappChatHistory from '@/features/patients/components/WhatsappChatHistory';
import { useLanguage } from '@/context/LanguageContext';
import { useDoctors } from '@/context/DoctorContextDefinition';
import './GlobalWhatsappMessenger.css';

/**
 * GlobalWhatsappMessenger Organism
 * 
 * Follows ARQUITECTURA.md:
 * - Atomic Design: Organism
 * - BEM naming
 * - i18n support (no hardcoded strings)
 * - Uses atoms (Button, Icon)
 */
const GlobalWhatsappMessenger = () => {
    const { t } = useLanguage();
    const { viewDoctorId, doctorDisplayName } = useDoctors();
    const [isOpen, setIsOpen] = useState(false);
    const [activeChat, setActiveChat] = useState(null); // { patientId: number | null, phone: string }
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState({ status: 'connected', qr_code: '' });
    const [statusLoading, setStatusLoading] = useState(true);

    const fetchConversations = useCallback(async (isAuto = false) => {
        if (!isAuto) setLoading(true);
        try {
            const res = await api.get('/whatsapp/recent', {
                params: { doctor_id: viewDoctorId }
            });
            if (res.data.success) {
                setConversations(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching recent conversations", error);
        } finally {
            if (!isAuto) setLoading(false);
        }
    }, [viewDoctorId]);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get('/whatsapp/status');
            console.log("[WhatsApp] Status response:", res.data);
            if (res.data.success) {
                setBridgeStatus({ status: res.data.status, qr_code: res.data.qr_code });
            }
        } catch (error) {
            console.error("[WhatsApp] Failed to fetch status:", error);
            setBridgeStatus({ status: 'offline', qr_code: '' });
        } finally {
            setStatusLoading(false);
        }
    }, []);

    // Polling logic
    useEffect(() => {
        if (isOpen) {
            // Initial fetch wrapped in timeout to avoid linter warning
            const t = setTimeout(() => fetchStatus(), 0);
            
            const statusInterval = setInterval(fetchStatus, 5000);
            
            let conversationsInterval;
            if (bridgeStatus.status === 'connected' && !activeChat) {
                const t2 = setTimeout(() => fetchConversations(), 0);
                conversationsInterval = setInterval(() => fetchConversations(true), 5000);
                
                // Limpiar t2 si el efecto se desmonta rápido
                return () => {
                    clearTimeout(t);
                    clearTimeout(t2);
                    clearInterval(statusInterval);
                    if (conversationsInterval) clearInterval(conversationsInterval);
                };
            }

            return () => {
                clearTimeout(t);
                clearInterval(statusInterval);
                if (conversationsInterval) clearInterval(conversationsInterval);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeChat, bridgeStatus.status, viewDoctorId]);

    const handlePatientClick = (conv) => {
        setActiveChat({ patientId: conv.patient_id, phone: conv.patient_phone });
    };

    const handleBack = () => {
        setActiveChat(null);
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
            <div className="global-wa-trigger-container">
                <Button 
                    className="global-wa-simple-btn" 
                    onClick={() => setIsOpen(true)}
                    variant="success"
                    icon={<Icon name="CHAT" size="1.2rem" />}
                >
                    {t('whatsapp_messenger')}
                </Button>
            </div>
        );
    }

    return (
        <aside className={`
            global-wa-messenger 
            ${activeChat ? 'global-wa-messenger--chat-active' : ''} 
            animate-slideUp
        `}>
            {/* Sidebar: Conversations List */}
            <section className="global-wa-messenger__sidebar">
                <header className="global-wa-messenger__sidebar-header">
                    <div className="global-wa-messenger__title">
                        <h3>{t('contacts')}</h3>
                    </div>
                    {viewDoctorId && (
                        <div className="global-wa-messenger__doctor-filter" title={t('filtering_by_doctor')}>
                            <Icon name="person" size="0.9rem" />
                            <span>{doctorDisplayName || t('doctor')}</span>
                        </div>
                    )}
                    <div className="global-wa-messenger__header-actions">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => fetchConversations()} 
                            title={t('whatsapp_refresh')}
                            icon={<Icon name="refresh" size="1.1rem" />}
                        />
                        <Button 
                            variant="ghost"
                            size="sm"
                            className="global-wa-messenger__close-btn" 
                            onClick={() => setIsOpen(false)}
                            icon={<Icon name="close" size="1.2rem" />}
                        />
                    </div>
                </header>
                
                <div className="global-wa-messenger__inbox">
                    {loading && conversations.length === 0 ? (
                        <div className="global-wa-messenger__empty">{t('loading')}</div>
                    ) : conversations.length === 0 ? (
                        <div className="global-wa-messenger__empty">{t('no_recent_chats')}</div>
                    ) : (
                        <ul className="global-wa-messenger__list">
                             {conversations.map(conv => {
                                 const isSelected = activeChat && 
                                    (conv.patient_id ? activeChat.patientId === conv.patient_id : activeChat.phone === conv.patient_phone);
                                 const chatKey = conv.patient_id || conv.patient_phone;
                                 
                                 return (
                                    <li 
                                        key={chatKey} 
                                        className={`global-wa-messenger__list-item ${isSelected ? 'global-wa-messenger__list-item--active' : ''}`} 
                                        onClick={() => handlePatientClick(conv)}
                                    >
                                    <div className="global-wa-messenger__item-avatar">
                                        {(conv.patient_name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="global-wa-messenger__item-info">
                                        <div className="global-wa-messenger__item-header">
                                            <strong>{conv.patient_name || conv.patient_phone || t('unknown')}</strong>
                                            <span className="global-wa-messenger__item-time">{formatTime(conv.created_at)}</span>
                                        </div>
                                        <p className="global-wa-messenger__item-body">
                                            {conv.direction === 'outbound' ? `${t('you')}: ` : ''}{conv.body}
                                        </p>
                                    </div>
                                     {conv.direction === 'inbound' && !isSelected && (
                                         <div className="global-wa-messenger__unread-dot" title={t('unread_messages')}></div>
                                     )}
                                 </li>
                                 );
                             })}
                        </ul>
                    )}
                </div>
            </section>

            {/* Main: Chat View */}
            <section className="global-wa-messenger__chat-area">
                <header className="global-wa-messenger__chat-header">
                     <div className="global-wa-messenger__header-left">
                        {activeChat && (
                            <Button 
                                variant="ghost"
                                size="sm"
                                className="global-wa-messenger__back-btn" 
                                onClick={handleBack}
                                icon={<Icon name="arrow_back" size="1.2rem" />}
                            />
                        )}
                        <div className="global-wa-messenger__chat-user">
                            {activeChat ? (
                                <>
                                    <strong>{activeChat.patientId ? (conversations.find(c => c.patient_id === activeChat.patientId)?.patient_name) : activeChat.phone}</strong>
                                    <span className="global-wa-messenger__online-status">{t('live')}</span>
                                </>
                            ) : (
                                <div className="global-wa-messenger__chat-placeholder-header">
                                    {t('whatsapp_messenger')}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="global-wa-messenger__header-actions">
                        {activeChat && !activeChat.patientId && (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className="global-wa-messenger__register-manual-btn"
                                onClick={() => {
                                    // Custom event or logic to open registration modal with phone
                                    const event = new CustomEvent('openPatientRegistration', { 
                                        detail: { phone: activeChat.phone } 
                                    });
                                    window.dispatchEvent(event);
                                }}
                                icon={<Icon name="person_add" size="1rem" />}
                            >
                                {t('register_contact') || 'Registrar'}
                            </Button>
                        )}
                        <Button 
                            variant="ghost"
                            size="sm"
                            className="global-wa-messenger__close-btn" 
                            onClick={() => setIsOpen(false)}
                            icon={<Icon name="close" size="1.2rem" />}
                        />
                    </div>
                </header>

                <div className="global-wa-messenger__chat-content">
                    {bridgeStatus.status !== 'connected' ? (
                        <div className="global-wa-messenger__pairing">
                            <div className="global-wa-messenger__pairing-card animate-fadeIn">
                                <div className="global-wa-messenger__pairing-icon-wrapper">
                                    <div className={`global-wa-messenger__pairing-icon global-wa-messenger__pairing-icon--${bridgeStatus.status}`}>
                                        <Icon name={bridgeStatus.status === 'offline' ? 'cloud_off' : 'qr_code_scanner'} size="2.5rem" />
                                    </div>
                                    <div className={`global-wa-messenger__pulse-ring global-wa-messenger__pulse-ring--${bridgeStatus.status}`}></div>
                                </div>
                                
                                <h3>{t(bridgeStatus.status === 'offline' ? 'bridge_offline_title' : 'whatsapp_pairing_required')}</h3>
                                <p>
                                    {bridgeStatus.status === 'offline' 
                                        ? t('bridge_offline_desc') 
                                        : t('whatsapp_pairing_desc')}
                                </p>
                                
                                {bridgeStatus.status !== 'offline' && (
                                    <div className="global-wa-messenger__qr-wrapper">
                                        {bridgeStatus.qr_code ? (
                                            <div className="global-wa-messenger__qr-container animate-zoomIn">
                                                <QRCodeSVG 
                                                    value={bridgeStatus.qr_code}
                                                    size={240}
                                                    level="H"
                                                    className="global-wa-messenger__qr-image"
                                                />
                                            </div>
                                        ) : (
                                            <div className="global-wa-messenger__qr-placeholder">
                                                <div className="global-wa-messenger__loader"></div>
                                                <span>{t('generating_qr') || 'Generando código...'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="global-wa-messenger__pairing-actions">
                                    <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        onClick={fetchStatus}
                                        loading={statusLoading}
                                        icon={<Icon name="refresh" size="1rem" />}
                                    >
                                        {t('whatsapp_refresh')}
                                    </Button>
                                </div>
                                
                                <div className="global-wa-messenger__pairing-footer">
                                    <span className={`global-wa-messenger__status-indicator global-wa-messenger__status-indicator--${bridgeStatus.status}`}>
                                        {bridgeStatus.status === 'offline' ? t('offline') : t('waiting_connection')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : activeChat ? (
                        <div className="global-wa-messenger__chat-wrapper">
                            <WhatsappChatHistory 
                                patientId={activeChat.patientId} 
                                phone={activeChat.phone}
                                t={t} 
                                hideHeader={true} 
                            />
                        </div>
                    ) : (
                        <div className="global-wa-messenger__placeholder">
                            <div className="global-wa-messenger__placeholder-icon">
                                <Icon name="whatsapp" size="4rem" />
                            </div>
                            <h3>{t('select_chat_title')}</h3>
                            <p>{t('select_chat_desc')}</p>
                        </div>
                    )}
                </div>
            </section>
        </aside>
    );
};

export default GlobalWhatsappMessenger;
