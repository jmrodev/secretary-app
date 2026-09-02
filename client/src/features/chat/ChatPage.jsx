import React from 'react';
import { useMessagesPageController } from '@/features/chat/hooks/useMessagesPageController';
import { ChatSidebar } from '@/features/chat/components/sections/ChatSidebar';
import { ChatWindow } from '@/features/chat/components/sections/ChatWindow';
import { MainLayout } from '@/components/templates/MainLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { WhatsappPairing } from '@/components/molecules/WhatsappPairing';
import styles from './ChatPage.module.css';


/**
 * ChatPage (Orchestrator).
 * Full-screen chat experience for staff and admins.
 */
export const ChatPage = () => {
    const { t } = useLanguage();
    const {
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
        handleRefreshBridge
    } = useMessagesPageController();

    const isBridgeConnected = bridgeStatus.status === 'connected';
    const showInlineQR = !isBridgeConnected && bridgeStatus.status !== 'offline';

    return (
        <MainLayout title={t('whatsapp_history')}>
            <section className={`${selectedConvo ? styles['ChatPage__chatPageOrchestratorConvoSelected'] : ''} `}>
                {/* Bridge status indicator */}
                <div className={styles.ChatPage__bridgeStatus} data-testid="bridge-status">
                    <span className={`${styles.ChatPage__statusDot} ${styles[`ChatPage__statusDot--${bridgeStatus.status.replace(/_/g, '-')}`]}`} />
                    <span>{t(`bridge_status_${bridgeStatus.status}`)}</span>
                    {!isBridgeConnected && (
                        <button type="button" onClick={handleRefreshBridge} disabled={bridgeStatusLoading} data-testid="bridge-reconnect">
                            {t('whatsapp_refresh')}
                        </button>
                    )}
                </div>
                {showInlineQR && (
                    <div data-testid="bridge-qr">
                        <WhatsappPairing bridgeStatus={bridgeStatus} onRefresh={handleRefreshBridge} statusLoading={bridgeStatusLoading} t={t} qrCode={bridgeStatus.qr_code} />
                    </div>
                )}
                <div>
                    <div className={styles.ChatPage__container}>
                        <ChatSidebar
                            className={`${styles.ChatPage__chatSidebar}`}
                            conversations={conversations}
                            selectedConvo={selectedConvo}
                            onSelectConvo={setSelectedConvo}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            recipients={recipients}
                            onStartNewChat={startNewChat}
                            unreadCount={unreadCount}
                        />

                        <ChatWindow
                            className={`${styles.ChatPage__chatWindow}`}
                            selectedConvo={selectedConvo}
                            thread={thread}
                            user={user}
                            loading={loading}
                            sending={sending}
                            messageText={messageText}
                            setMessageText={setMessageText}
                            onSendMessage={handleSendMessage}
                            scrollRef={scrollRef}
                            onBack={() => setSelectedConvo(null)} // Call setSelectedConvo(null) to go back
                        />
                    </div>
                </div>
            </section>
        </MainLayout>
    );

};
