import React from 'react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatTime } from '@/utils/core/dateUtils';
import styles from './WhatsappInbox.module.css';

const AVATAR_COLORS = [
    styles.avatarColor0,
    styles.avatarColor1,
    styles.avatarColor2,
    styles.avatarColor3,
    styles.avatarColor4,
    styles.avatarColor5,
    styles.avatarColor6,
    styles.avatarColor7,
];

const getAvatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

/**
 * WhatsappInbox Molecule.
 * Renders the list of recent conversations for the WhatsApp messenger.
 */
const WhatsappInbox = ({ 
    conversations, 
    activeChat, 
    loading, 
    onPatientClick, 
    onRefresh, 
    onClose, 
    bridgeStatus,
    onDisconnect,
    disconnecting,
    t 
}) => {
    return (
        <section className={styles.sidebar}>
            <header className={styles.sidebarHeader}>
                <div className={styles.title}>
                    <h3>{t('contacts')}</h3>
                </div>
                <div className={styles.headerActions}>
                    {bridgeStatus?.status === 'connected' && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={onDisconnect}
                            loading={disconnecting}
                            title={t('disconnect_bridge')}
                            icon={<Icon name="link_off" size="1.1rem" />}
                        />
                    )}
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={onRefresh} 
                        title={t('whatsapp_refresh')}
                        icon={<Icon name="refresh" size="1.1rem" />}
                    />
                    <Button 
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        icon={<Icon name="close" size="1.2rem" />}
                    />
                </div>
            </header>
            
            <div className={styles.inbox}>
                {loading && conversations.length === 0 ? (
                    <div className={styles.empty}>{t('loading')}</div>
                ) : conversations.length === 0 ? (
                    <div className={styles.empty}>{t('no_recent_chats')}</div>
                ) : (
                    <ul className={styles.list}>
                         {conversations.map(conv => {
                             const isSelected = activeChat && 
                                (conv.patient_id ? activeChat.patientId === conv.patient_id : activeChat.phone === conv.patient_phone);
                             const chatKey = conv.patient_id || conv.patient_phone || conv.sender_phone || `conv-${index}`;
                             const displayName = conv.patient_name || conv.patient_phone || t('unknown');
                             const initial = displayName.charAt(0).toUpperCase();
                             
                             return (
                                <li 
                                    key={chatKey} 
                                    role="button"
                                    tabIndex={0}
                                    className={`${styles.listItem} ${isSelected ? styles.listItemActive : ''}`}
                                    onClick={() => onPatientClick(conv)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onPatientClick(conv);
                                        }
                                    }}
                                >
                                <div className={`${styles.itemAvatar} ${getAvatarColor(displayName)}`}>
                                    {initial}
                                </div>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemHeader}>
                                        <strong>{displayName}</strong>
                                        {conv.created_at && (
                                            <span className={styles.itemTime}>
                                                {formatTime(conv.created_at)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={styles.itemBody}>
                                        {conv.direction === 'outbound' ? `${t('you')}: ` : ''}{conv.body}
                                    </p>
                                </div>
                                 {conv.direction === 'inbound' && !isSelected && (
                                     <div className={styles.unreadDot} title={t('unread_messages')}></div>
                                 )}
                             </li>
                             );
                         })}
                    </ul>
                )}
            </div>
        </section>
    );
};

export default WhatsappInbox;
