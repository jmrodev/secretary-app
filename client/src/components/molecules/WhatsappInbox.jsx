import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatTime } from '@/utils/core/dateUtils';
import { api } from '@/api/axios';
import styles from '../organisms/GlobalWhatsappMessenger.module.css';

/**
 * WhatsappInbox Molecule.
 * Renders the list of recent conversations and synchronized phone contacts for the WhatsApp messenger.
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
    const [searchTerm, setSearchTerm] = useState('');
    const [phoneContacts, setPhoneContacts] = useState([]);
    const [searchingContacts, setSearchingContacts] = useState(false);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setPhoneContacts([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setSearchingContacts(true);
                const res = await api.get(`/whatsapp/contacts?query=${encodeURIComponent(searchTerm)}&limit=15`);
                if (res.data?.success) {
                    setPhoneContacts(res.data.contacts || []);
                }
            } catch (err) {
                console.error("Error buscando contactos del teléfono:", err);
            } finally {
                setSearchingContacts(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const filteredConversations = conversations.filter(conv => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            (conv.patient_name || '').toLowerCase().includes(q) ||
            (conv.patient_phone || '').includes(q) ||
            (conv.body || '').toLowerCase().includes(q)
        );
    });

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
                            title={t('whatsapp_logout')}
                            icon={<Icon name="logout" size="1.1rem" color="var(--danger)" />}
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

            <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('search_chats_or_contacts', 'Buscar chat o contacto...')}
                    style={{
                        width: '100%',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.85rem',
                        background: 'var(--card-surface-bg, #1e293b)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        color: 'var(--text-main)',
                        outline: 'none'
                    }}
                />
            </div>
            
            <div className={styles.GlobalWhatsappMessenger__inbox}>
                {/* Contactos del Celular encontrados */}
                {searchTerm.trim() && phoneContacts.length > 0 && (
                    <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(37, 211, 102, 0.08)', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#25D366', marginBottom: '0.25rem' }}>
                            {t('phone_contacts', 'Contactos del teléfono')}
                        </div>
                        <ul className={`${styles.GlobalWhatsappMessenger__list}`}>
                            {phoneContacts.map(c => (
                                <li key={c.phone} className={styles.GlobalWhatsappMessenger__listItem} style={{ padding: '0.4rem 0.5rem' }}>
                                    <button
                                        type="button"
                                        className={styles.GlobalWhatsappMessenger__listItemButton}
                                        onClick={() => onPatientClick({
                                            patient_id: null,
                                            patient_phone: c.phone,
                                            patient_name: c.fullName || c.pushName || c.phone
                                        })}
                                    >
                                        <div className={styles.GlobalWhatsappMessenger__itemAvatar} style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                                            {(c.fullName || c.phone).charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.GlobalWhatsappMessenger__itemInfo}>
                                            <strong>{c.fullName || c.pushName || c.phone}</strong>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.phone}</span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {loading && filteredConversations.length === 0 ? (
                    <div className={styles.GlobalWhatsappMessenger__emptyInbox}>{t('loading')}</div>
                ) : filteredConversations.length === 0 && phoneContacts.length === 0 ? (
                    <div className={styles.GlobalWhatsappMessenger__emptyInbox}>{t('no_recent_chats')}</div>
                ) : (
                    <ul className={`${styles.GlobalWhatsappMessenger__list} custom-scrollbar`}>
                         {filteredConversations.map(conv => {
                             const isSelected = activeChat && 
                                (conv.patient_id ? activeChat.patientId === conv.patient_id : activeChat.phone === conv.patient_phone);
                             const chatKey = conv.patient_id || conv.patient_phone;
                             
                             return (
                                  <li key={chatKey} className={`${styles.GlobalWhatsappMessenger__listItem} ${isSelected ? styles.GlobalWhatsappMessenger__listItemActive : ''}`}>
                                      <button
                                          type="button"
                                          className={styles.GlobalWhatsappMessenger__listItemButton}
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
                                      </button>
                                  </li>
                                );
                         })}
                    </ul>
                )}
            </div>
        </section>
    );
};

