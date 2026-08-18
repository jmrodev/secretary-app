import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatTime } from '@/utils/core/dateUtils';
import styles from '../organisms/GlobalWhatsappMessenger.module.css';

/**
 * WhatsappInbox Molecule.
 * Renders the list of recent conversations for the WhatsApp messenger.
 */
export const WhatsappInbox = ({ 
    conversations, 
    activeChat, 
    loading, 
    onPatientClick, 
    onRefresh, 
    onClose, 
    viewDoctorId, 
    doctorDisplayName, 
    bridgeStatus,
    onLogout,
    t 
}) => {
    return (
        <section className={styles.GlobalWhatsappMessenger__sidebar}>
            <header className={styles.GlobalWhatsappMessenger__sidebarHeader}>
                <div className={styles.GlobalWhatsappMessenger__title}>
                    <Icon name="whatsapp" size="1.2rem" color="#25D366" />
                    <h3>{t('contacts')}</h3>
                </div>
                {viewDoctorId && (
                    <div className={styles.GlobalWhatsappMessenger__doctorFilter} title={t('filtering_by_doctor')}>
                        <Icon name="person" size="0.9rem" />
                        <span>{doctorDisplayName || t('doctor')}</span>
                    </div>
                )}
                <div className={styles.GlobalWhatsappMessenger__headerActions}>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={onRefresh} 
                        title={t('whatsapp_refresh')}
                        icon={<Icon name="refresh" size="1.1rem" />}
                    />
                    {bridgeStatus?.status === 'connected' && (
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={onLogout} 
                            title={t('whatsapp_logout') || 'Desconectar'}
                            icon={<Icon name="logout" size="1.1rem" color="#ef4444" />}
                        />
                    )}
                    <Button 
                        variant="ghost"
                        size="sm"
                        className={styles.GlobalWhatsappMessenger__closeBtn} 
                        onClick={onClose}
                        icon={<Icon name="close" size="1.2rem" />}
                    />
                </div>
            </header>
            
            <div className={styles.GlobalWhatsappMessenger__inbox}>
                {loading && conversations.length === 0 ? (
                    <div>{t('loading')}</div>
                ) : conversations.length === 0 ? (
                    <div>{t('no_recent_chats')}</div>
                ) : (
                    <ul className={`${styles.GlobalWhatsappMessenger__list} custom-scrollbar`}>
                         {conversations.map(conv => {
                             const isSelected = activeChat && 
                                (conv.patient_id ? activeChat.patientId === conv.patient_id : activeChat.phone === conv.patient_phone);
                             const chatKey = conv.patient_id || conv.patient_phone;
                             
                             return (
                                <li 
                                    key={chatKey} 
                                    role="button"
                                    tabIndex={0}
                                    className={`${styles.GlobalWhatsappMessenger__listItem} ${isSelected ? styles.GlobalWhatsappMessenger__listItemActive : ''}`} 
                                    onClick={() => onPatientClick(conv)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onPatientClick(conv);
                                        }
                                    }}
                                >
                                <div className={styles.GlobalWhatsappMessenger__itemAvatar}>
                                    {(conv.patient_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className={styles.GlobalWhatsappMessenger__itemInfo}>
                                    <div className={styles.GlobalWhatsappMessenger__itemHeader}>
                                        <strong>{conv.patient_name || conv.patient_phone || t('unknown')}</strong>
                                        {conv.last_message_time && (
                                            <span className={styles.GlobalWhatsappMessenger__itemTime}>
                                                {formatTime(conv.last_message_time)}
                                            </span>
                                        )}
                                    </div>
                                    <p className={styles.GlobalWhatsappMessenger__itemBody}>
                                        {conv.direction === 'outbound' ? `${t('you')}: ` : ''}{conv.body}
                                    </p>
                                </div>
                                 {conv.direction === 'inbound' && !isSelected && (
                                     <div className={styles.GlobalWhatsappMessenger__unreadDot} title={t('unread_messages')}></div>
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

