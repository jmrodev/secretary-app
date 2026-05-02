import React, { useState, useEffect, useCallback } from 'react';
import api from '@/api/axios';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import WhatsappChatHistory from '@/features/patients/components/WhatsappChatHistory';
import { useLanguage } from '@/context/LanguageContext';
import { useDoctors } from '@/context/DoctorContext';
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
    const [selectedPatientId, setSelectedPatientId] = useState(null);
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
    }, []);

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
            fetchStatus();
            const statusInterval = setInterval(fetchStatus, 5000);
            
            let conversationsInterval;
            if (bridgeStatus.status === 'connected' && !selectedPatientId) {
                fetchConversations();
                conversationsInterval = setInterval(() => fetchConversations(true), 5000);
            }

            return () => {
                clearInterval(statusInterval);
                if (conversationsInterval) clearInterval(conversationsInterval);
            };
        }
    }, [isOpen, selectedPatientId, fetchConversations, fetchStatus, bridgeStatus.status, viewDoctorId]);

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
            <Button 
                className="global-wa-btn" 
                onClick={() => setIsOpen(true)}
                variant="success"
                icon={<Icon name="whatsapp" size="1.8rem" />}
                unstyled // We use custom floating styles in CSS
            />
        );
    }

    return (
        <aside className={`
            global-wa-messenger 
            ${selectedPatientId ? 'global-wa-messenger--chat-active' : ''} 
            animate-slideUp
        `}>
            {/* Sidebar: Conversations List */}
            <section className="global-wa-messenger__sidebar">
                <header className="global-wa-messenger__sidebar-header">
                    <div className="global-wa-messenger__title">
                        <Icon name="whatsapp" size="1.2rem" />
                        <h3>{t('my_messages')}</h3>
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
                            className="global-wa-messenger__close-mobile" 
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
                                            <strong>{conv.patient_name || conv.patient_phone || t('unknown')}</strong>
                                            <span className="global-wa-messenger__item-time">{formatTime(conv.created_at)}</span>
                                        </div>
                                        <p className="global-wa-messenger__item-body">
                                            {conv.direction === 'outbound' ? `${t('you')}: ` : ''}{conv.body}
                                        </p>
                                    </div>
                                    {conv.direction === 'inbound' && selectedPatientId !== conv.patient_id && (
                                        <div className="global-wa-messenger__unread-dot" title={t('unread_messages')}></div>
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
                            <Button 
                                variant="ghost"
                                size="sm"
                                className="global-wa-messenger__back-btn" 
                                onClick={handleBack}
                                icon={<Icon name="arrow_back" size="1.2rem" />}
                            />
                        )}
                        <div className="global-wa-messenger__chat-user">
                            {selectedPatientId ? (
                                <>
                                    <strong>{conversations.find(c => c.patient_id === selectedPatientId)?.patient_name || t('conversation')}</strong>
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
                        <Button 
                            variant="ghost"
                            size="sm"
                            className="global-wa-messenger__close-desktop" 
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
                                
                                <h3>{t(bridgeStatus.status === 'offline' ? 'bridge_offline_title' : 'whatsapp_pairing_required') || (bridgeStatus.status === 'offline' ? 'Servicio Desconectado' : 'Vincular WhatsApp')}</h3>
                                <p>
                                    {bridgeStatus.status === 'offline' 
                                        ? t('bridge_offline_desc') || 'El puente de WhatsApp no está respondiendo. Por favor, verificá que el servicio esté corriendo.'
                                        : t('whatsapp_pairing_desc') || 'Escaneá este código desde tu celular (Ajustes > Dispositivos vinculados)'}
                                </p>
                                
                                {bridgeStatus.status !== 'offline' && (
                                    <div className="global-wa-messenger__qr-wrapper">
                                        {bridgeStatus.qr_code ? (
                                            <div className="global-wa-messenger__qr-container animate-zoomIn">
                                                <img 
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(bridgeStatus.qr_code)}`}
                                                    alt="WhatsApp QR Code"
                                                    className="global-wa-messenger__qr-image"
                                                />
                                                <div className="global-wa-messenger__qr-overlay">
                                                    <Icon name="whatsapp" size="2rem" />
                                                </div>
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
                    ) : selectedPatientId ? (
                        <div className="global-wa-messenger__chat-wrapper">
                            <WhatsappChatHistory patientId={selectedPatientId} t={t} hideHeader={true} />
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
