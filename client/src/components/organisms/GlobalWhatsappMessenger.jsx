import React, { useEffect, useCallback, useRef } from 'react';
import { api } from '@/api/axios';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { WhatsappChatHistory } from '@/features/patients/components/views/WhatsappChatHistory';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { WhatsappInbox } from '../molecules/WhatsappInbox';
import { WhatsappPairing } from '../molecules/WhatsappPairing';
import { WhatsappChatPlaceholder } from '../molecules/WhatsappChatPlaceholder';
import { WhatsappBroadcast } from '../molecules/WhatsappBroadcast';
import styles from './GlobalWhatsappMessenger.module.css';

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
    activeTab: 'inbox',
    activeChat: null,
    conversations: [],
    loading: false,
    bridgeStatus: { status: 'connected', qr_code: '', session_expired_since: null },
    statusLoading: true,
};

function messengerReducer(state, action) {
    switch (action.type) {
        case 'SET_OPEN': return { ...state, isOpen: action.payload };
        case 'SET_TAB': return { ...state, activeTab: action.payload, activeChat: null };
        case 'SET_ACTIVE_CHAT': return { ...state, activeChat: action.payload };
        case 'SET_CONVERSATIONS': return { ...state, conversations: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_BRIDGE_STATUS': return { ...state, bridgeStatus: action.payload };
        case 'SET_STATUS_LOADING': return { ...state, statusLoading: action.payload };
        case 'UPDATE_MANY': return { ...state, ...action.payload };
        default: return state;
    }
}

export const GlobalWhatsappMessenger = ({ t }) => {
    useDoctors();
    const [state, dispatch] = React.useReducer(messengerReducer, initialState);
    const { isOpen, activeTab, activeChat, conversations, loading, bridgeStatus, statusLoading } = state;

    const setIsOpen = (val) => dispatch({ type: 'SET_OPEN', payload: val });
    const setActiveChat = (val) => dispatch({ type: 'SET_ACTIVE_CHAT', payload: val });

    const fetchConversations = useCallback(async (isAuto = false) => {
        if (!isAuto) dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const res = await api.get('/whatsapp/recent');
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
    }, []);

    // Ref indirection breaks the circular fetchStatus <-> handleManualRefresh
    // dependency so both can stay stable (useCallback) without stale closures.
    const handleManualRefreshRef = useRef(null);

    const fetchStatus = useCallback(async (isAutoCall = false) => {
        try {
            const res = await api.get('/whatsapp/status');
            if (res.data.success) {
                dispatch({ 
                    type: 'UPDATE_MANY', 
                    payload: { 
                        bridgeStatus: { status: res.data.status, qr_code: res.data.qr_code, session_expired_since: res.data.session_expired_since || null },
                        statusLoading: false
                    } 
                });

                // Auto-refresh if QR timed out (disconnected/session_expired & empty QR) and we aren't already refreshing
                if ((res.data.status === 'disconnected' || res.data.status === 'session_expired') && !res.data.qr_code && !isAutoCall) {
                    console.log("[WhatsApp] Stale/Timeout QR detected. Auto-refreshing...");
                    handleManualRefreshRef.current?.();
                }
            } else {
                dispatch({ 
                    type: 'UPDATE_MANY', 
                    payload: { 
                        bridgeStatus: { status: 'offline', qr_code: '', session_expired_since: null },
                        statusLoading: false
                    } 
                });
            }
        } catch (error) {
            console.error("[WhatsApp] Failed to fetch status:", error);
            dispatch({ 
                type: 'UPDATE_MANY', 
                payload: { 
                    bridgeStatus: { status: 'offline', qr_code: '', session_expired_since: null },
                    statusLoading: false
                } 
            });
        }
    }, []);

    const handleManualRefresh = useCallback(async () => {
        dispatch({ type: 'SET_STATUS_LOADING', payload: true });
        try {
            await api.post('/whatsapp/refresh');
            // Give the bridge time to rebuild the client and generate a new QR
            await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
            console.error("[WhatsApp] Failed to refresh bridge:", error);
        } finally {
            fetchStatus(true);
        }
    }, [fetchStatus]);

    // Keep the latest handleManualRefresh reachable from the stable fetchStatus
    useEffect(() => {
        handleManualRefreshRef.current = handleManualRefresh;
    }, [handleManualRefresh]);

    const handleLogout = useCallback(async () => {
        if (!window.confirm(t('confirm_logout_bridge'))) return;
        dispatch({ type: 'SET_STATUS_LOADING', payload: true });
        try {
            await api.post('/whatsapp/logout');
            // Give it 1.5s to let the bridge write files and restart
            await new Promise((resolve) => setTimeout(resolve, 1500));
        } catch (error) {
            console.error("[WhatsApp] Failed to logout:", error);
        } finally {
            fetchStatus();
        }
    }, [fetchStatus, t]);

    // Use React 19 useEffectEvent for stable, up-to-date callback references
    const onPollStatus = React.useEffectEvent(() => {
        fetchStatus();
    });

    const onPollConversations = React.useEffectEvent(() => {
        if (bridgeStatus.status === 'connected' && !activeChat) {
            fetchConversations(true);
        }
    });

    useEffect(() => {
        if (!isOpen) return;

        // Initial fetch
        onPollStatus();
        
        const statusInterval = setInterval(onPollStatus, 5000);
        const conversationsInterval = setInterval(onPollConversations, 5000);

        return () => {
            clearInterval(statusInterval);
            clearInterval(conversationsInterval);
        };
    }, [isOpen]); // Only depends on isOpen now!

    // Listen for external requests to open a specific patient chat
    useEffect(() => {
        const handleOpenChat = (e) => {
            const { phone, patientId, patientName } = e.detail || {};
            if (!phone) return;
            dispatch({ type: 'SET_OPEN', payload: true });
            dispatch({ type: 'SET_ACTIVE_CHAT', payload: { phone, patientId: patientId || null, patientName } });
            fetchConversations();
        };

        window.addEventListener('whatsapp:open-chat', handleOpenChat);
        return () => window.removeEventListener('whatsapp:open-chat', handleOpenChat);
    }, [fetchConversations]);

    const handlePatientClick = (conv) => {
        setActiveChat({ patientId: conv.patientId || conv.patient_id, phone: conv.patient_phone });
    };

    const handleBack = () => {
        setActiveChat(null);
        fetchConversations();
    };

    if (!isOpen) {
        return (
            <div className={`${styles.GlobalWhatsappMessenger__globalWaTriggerContainer}`}>
                <Button 
                    className={`${styles.GlobalWhatsappMessenger__globalWaSimpleBtn}`} 
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
        <aside className={`${styles.GlobalWhatsappMessenger__root} ${styles.GlobalWhatsappMessenger__animateSlideUp} ${activeChat ? styles.GlobalWhatsappMessenger__chatActive : ''}`}>
            {/* Sidebar: Conversations List */}
            {/* Tab bar - Inbox / Broadcast */}
            <div className={styles.GlobalWhatsappMessenger__tabBar}>
                <button
                    type="button"
                    id="wa-tab-inbox"
                    className={`${styles.GlobalWhatsappMessenger__tab} ${activeTab === 'inbox' ? styles.GlobalWhatsappMessenger__tabActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'inbox' })}
                >
                    <Icon name="forum" size="1rem" />
                    {t('inbox_tab')}
                </button>
                <button
                    type="button"
                    id="wa-tab-broadcast"
                    className={`${styles.GlobalWhatsappMessenger__tab} ${activeTab === 'broadcast' ? styles.GlobalWhatsappMessenger__tabActive : ''}`}
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'broadcast' })}
                >
                    <Icon name="campaign" size="1rem" />
                    {t('broadcast_tab')}
                </button>
            </div>

            <WhatsappInbox 
                conversations={conversations}
                activeChat={activeChat}
                loading={loading}
                onPatientClick={handlePatientClick}
                onRefresh={() => fetchConversations()}
                onClose={() => setIsOpen(false)}
                bridgeStatus={bridgeStatus}
                onLogout={handleLogout}
                t={t}
            />

            {/* Main: Chat View */}
            <section className={`${styles.GlobalWhatsappMessenger__chatArea}`}>
                <header className={`${styles.GlobalWhatsappMessenger__chatHeader}`}>
                     <div className={`${styles.GlobalWhatsappMessenger__headerLeft}`}>
                        {activeChat && (
                            <Button 
                                variant="ghost"
                                size="sm"
                                className={`${styles.GlobalWhatsappMessenger__backBtn}`} 
                                onClick={handleBack}
                                icon={<Icon name="arrow_back" size="1.2rem" />}
                            />
                        )}
                        <div className={`${styles.GlobalWhatsappMessenger__chatUser}`}>
                            {activeChat ? (
                                <>
                                    <strong>{activeChat.patientId ? (conversations.find(c => (c.patientId === activeChat.patientId || c.patient_id === activeChat.patientId))?.patient_name) : activeChat.phone}</strong>
                                    <span className={`${styles.GlobalWhatsappMessenger__onlineStatus}`}>{t('live')}</span>
                                </>
                            ) : (
                                <div className={`${styles.GlobalWhatsappMessenger__chatPlaceholderHeader}`}>
                                    {t('whatsapp_messenger')}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className={`${styles.GlobalWhatsappMessenger__headerActions}`}>
                        {activeChat && !activeChat.patientId && (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                className={`${styles.GlobalWhatsappMessenger__registerManualBtn}`}
                                onClick={() => {
                                    const event = new CustomEvent('openPatientRegistration', { 
                                        detail: { phone: activeChat.phone } 
                                    });
                                    window.dispatchEvent(event);
                                }}
                                icon={<Icon name="person_add" size="1rem" />}
                            >
                                {t('register_contact')}
                            </Button>
                        )}
                        <Button 
                            variant="ghost"
                            size="sm"
                            className={`${styles.GlobalWhatsappMessenger__closeBtn}`} 
                            onClick={() => setIsOpen(false)}
                            icon={<Icon name="close" size="1.2rem" />}
                        />
                    </div>
                </header>

                <div className={`${styles.GlobalWhatsappMessenger__chatContent}`}>
                    {activeTab === 'broadcast' ? (
                        <WhatsappBroadcast t={t} />
                    ) : activeChat ? (
                        <div className={`${styles.GlobalWhatsappMessenger__chatWrapper}`}>
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

            {/* Pairing overlay — visible in sidebar when bridge is not connected */}
            {bridgeStatus.status !== 'connected' && (
                <div className={styles.GlobalWhatsappMessenger__pairingOverlay}>
                    <WhatsappPairing
                        bridgeStatus={bridgeStatus}
                        onRefresh={handleManualRefresh}
                        statusLoading={statusLoading}
                        t={t}
                    />
                </div>
            )}
        </aside>
    );
};

