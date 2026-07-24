import React from 'react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatTime } from '@/utils/core/dateUtils';

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
    viewDoctorId, 
    doctorDisplayName, 
    t 
}) => {
    return (
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
                        onClick={onRefresh} 
                        title={t('whatsapp_refresh')}
                        icon={<Icon name="refresh" size="1.1rem" />}
                    />
                    <Button 
                        variant="ghost"
                        size="sm"
                        className="global-wa-messenger__close-btn" 
                        onClick={onClose}
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
                                    role="button"
                                    tabIndex={0}
                                    className={`global-wa-messenger__list-item ${isSelected ? 'global-wa-messenger__list-item--active' : ''}`} 
                                    onClick={() => onPatientClick(conv)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onPatientClick(conv);
                                        }
                                    }}
                                >
                                <div className="global-wa-messenger__item-avatar">
                                    {(conv.patient_name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="global-wa-messenger__item-info">
                                    <div className="global-wa-messenger__item-header">
                                        <strong>{conv.patient_name || conv.patient_phone || t('unknown')}</strong>
                                        {conv.last_message_time && (
                                            <span className="global-wa-messenger__item-time">
                                                {formatTime(conv.last_message_time)}
                                            </span>
                                        )}
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
    );
};

export default WhatsappInbox;
