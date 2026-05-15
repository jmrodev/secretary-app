import React, { useEffect, useCallback } from 'react';
import api from '@/api/axios';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import WhatsappChatHistory from '@/features/patients/components/views/WhatsappChatHistory';
import { useLanguage } from '@/hooks/useLanguage';
import { useDoctors } from '@/context/DoctorContextDefinition';
import WhatsappInbox from '../molecules/WhatsappInbox';
import WhatsappPairing from '../molecules/WhatsappPairing';
import WhatsappChatPlaceholder from '../molecules/WhatsappChatPlaceholder';
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
const initialState = {
    isOpen: false,
    activeChat: null,
    conversations: [],
    loading: false,
    bridgeStatus: { status: 'connected', qr_code: '' },
    statusLoading: true,
};

function messengerReducer(state, action) {
    switch (action.type) {
        case 'SET_OPEN': return { ...state, isOpen: action.payload };
        case 'SET_ACTIVE_CHAT': return { ...state, activeChat: action.payload };
        case 'SET_CONVERSATIONS': return { ...state, conversations: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_BRIDGE_STATUS': return { ...state, bridgeStatus: action.payload };
        case 'SET_STATUS_LOADING': return { ...state, statusLoading: action.payload };
        case 'UPDATE_MANY': return { ...state, ...action.payload };
        default: return state;
    }
}

const GlobalWhatsappMessenger = () => {
    const { t } = useLanguage();
    const { viewDoctorId, doctorDisplayName } = useDoctors();
    const [state, dispatch] = React.useReducer(messengerReducer, initialState);
    const { isOpen, activeChat, conversations, loading, bridgeStatus, statusLoading } = state;

    const setIsOpen = (val) => dispatch({ type: 'SET_OPEN', payload: val });
    const setActiveChat = (val) => dispatch({ type: 'SET_ACTIVE_CHAT', payload: val });
    const setConversations = (val) => dispatch({ type: 'SET_CONVERSATIONS', payload: val });
    const setLoading = (val) => dispatch({ type: 'SET_LOADING', payload: val });
    const setBridgeStatus = (val) => dispatch({ type: 'SET_BRIDGE_STATUS', payload: val });
    const setStatusLoading = (val) => dispatch({ type: 'SET_STATUS_LOADING', payload: val });

    const fetchConversations = useCallback(async (isAuto = false) => {
        if (!isAuto) dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await api.get('/whatsapp/recent', {
                params: { doctor_id: viewDoctorId }
            });
            if (res.data.success) {
                dispatch({ 
                    type: 'UPDATE_MANY', 
                    payload: { conversations: res.data.data, loading: false } 
                });
            } else if (!isAuto) {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } catch (error) {
            console.error("Error fetching recent conversations", error);
            if (!isAuto) dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [viewDoctorId]);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await api.get('/whatsapp/status');
            if (res.data.success) {
                dispatch({ 
                    type: 'UPDATE_MANY', 
                    payload: { 
                        bridgeStatus: { status: res.data.status, qr_code: res.data.qr_code },
                        statusLoading: false
                    } 
                });
            } else {
                dispatch({ 
                    type: 'UPDATE_MANY', 
                    payload: { 
                        bridgeStatus: { status: 'offline', qr_code: '' },
                        statusLoading: false
                    } 
                });
            }
        } catch (error) {
            console.error("[WhatsApp] Failed to fetch status:", error);
            dispatch({ 
                type: 'UPDATE_MANY', 
                payload: { 
                    bridgeStatus: { status: 'offline', qr_code: '' },
                    statusLoading: false
                } 
            });
        }
    }, []);

    // Polling logic
    useEffect(() => {
        if (isOpen) {
            const initStatusTimer = setTimeout(() => fetchStatus(), 0);
            const statusInterval = setInterval(fetchStatus, 5000);
            
            let conversationsInterval;
            let initConvTimer;

            if (bridgeStatus.status === 'connected' && !activeChat) {
                initConvTimer = setTimeout(() => fetchConversations(), 0);
                conversationsInterval = setInterval(() => fetchConversations(true), 5000);
            }

            return () => {
                clearTimeout(initStatusTimer);
                if (initConvTimer) clearTimeout(initConvTimer);
                clearInterval(statusInterval);
                if (conversationsInterval) clearInterval(conversationsInterval);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, activeChat, bridgeStatus.status, viewDoctorId]);

    const handlePatientClick = (conv) => {
        setActiveChat({ patientId: conv.patientId || conv.patient_id, phone: conv.patient_phone });
    };

    const handleBack = () => {
        setActiveChat(null);
        fetchConversations();
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
            animate-slide-up
        `}>
            {/* Sidebar: Conversations List */}
            <WhatsappInbox 
                conversations={conversations}
                activeChat={activeChat}
                loading={loading}
                onPatientClick={handlePatientClick}
                onRefresh={() => fetchConversations()}
                onClose={() => setIsOpen(false)}
                viewDoctorId={viewDoctorId}
                doctorDisplayName={doctorDisplayName}
                t={t}
            />

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
                                    <strong>{activeChat.patientId ? (conversations.find(c => (c.patientId === activeChat.patientId || c.patient_id === activeChat.patientId))?.patient_name) : activeChat.phone}</strong>
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
                        <WhatsappPairing 
                            bridgeStatus={bridgeStatus}
                            onRefresh={fetchStatus}
                            statusLoading={statusLoading}
                            t={t}
                        />
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
                        <WhatsappChatPlaceholder t={t} />
                    )}
                </div>
            </section>
        </aside>
    );
};

export default GlobalWhatsappMessenger;
