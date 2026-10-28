import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/axios';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import { useWhatsappChatController } from '@/features/patients/hooks/useWhatsappChatController';
import styles from './WhatsappChatHistory.module.css';

const MessageBody = ({ body }) => {
    if (!body) return '';
    // Regex for matches like http://, https://, or www.
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const urlTest = /(https?:\/\/[^\s]+|www\.[^\s]+)/;
    const parts = body.split(urlRegex);
    return parts.map((part, i) => {
        if (urlTest.test(part)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            return (
                <a 
                    key={part} 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.WhatsappChatHistory__link}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
};

export const WhatsappChatHistory = ({ patientId, phone, t, hideHeader = false }) => {
    const { showMessage } = useMessage();
    const {
        state,
        dispatch,
        targetPhoneInput,
        handleTargetPhoneChange,
        messagesEndRef,
        handleGetAiSuggestion,
        handleSendMessage,
        fetchHistory
    } = useWhatsappChatController(patientId, phone, showMessage, t);
    
    const navigate = useNavigate();
    const { messages, loading, newMessage, sending, aiLoading, suggestedSlot } = state;

    const handleViewInCalendar = (slot) => {
        if (!slot?.date) return;
        navigate('/appointments', {
            state: {
                selectedDate: slot.date,
                viewDoctorId: slot.doctorId ? String(slot.doctorId) : undefined
            }
        });
    };

    const handleDeleteConversation = async () => {
        if (window.confirm(t('confirm_delete_conversation_history'))) {
            try {
                await api.post('/whatsapp/delete-conversation', { patientId, phone: targetPhoneInput || phone });
                showMessage(t('conversation_deleted_success'), "success");
                fetchHistory();
            } catch (err) {
                console.error("Error al borrar conversación", err);
                showMessage(t('conversation_delete_error'), "error");
            }
        }
    };

    return (
        <section className={`${styles.WhatsappChatHistory__root} ${hideHeader ? styles.WhatsappChatHistory__noHeader : ''}`}>
            {!hideHeader && (
                <header className={`${styles.WhatsappChatHistory__header}`}>
                    <div className={`${styles.WhatsappChatHistory__headerInfo}`}>
                        <Icon name="whatsapp" size="1.2rem" />
                        <h3 className={`${styles.WhatsappChatHistory__title}`}>{t('whatsapp_history')}</h3>
                        <div className={styles.WhatsappChatHistory__phoneInputContainer} title={t('whatsmeow_phone_hint')}>
                            <label htmlFor="whatsapp-target-phone" className={styles.WhatsappChatHistory__label}>
                                {t('whatsapp_target_phone')}
                            </label>
                            <div className={styles.WhatsappChatHistory__phoneInputRow}>
                                <Icon name="edit" size="0.85rem" />
                                <input
                                    id="whatsapp-target-phone"
                                    type="text"
                                    className={styles.WhatsappChatHistory__targetPhoneInput}
                                    value={targetPhoneInput}
                                    onChange={(e) => handleTargetPhoneChange(e.target.value)}
                                    placeholder="542494521825..."
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.WhatsappChatHistory__headerActions}>
                        <Button size="sm" variant="ghost" onClick={fetchHistory} title={t('refresh')} icon={<Icon name="refresh" size="1rem" />}>
                            {t('refresh')}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleDeleteConversation} title={t('delete_conversation')} icon={<Icon name="delete" size="1rem" />}>
                        </Button>
                    </div>
                </header>
            )}
            
            <div className={`${styles.WhatsappChatHistory__messages}`}>
                {loading && messages.length === 0 ? (
                    <div className="whatsapp-chat__loading">{t('loading')}</div>
                ) : messages.length === 0 ? (
                    <div className={`${styles.WhatsappChatHistory__empty}`}>{t('no_messages_yet')}</div>
                ) : (
                    messages.map((msg, index) => {
                        const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                        const isOutbound = msg.direction === 'outbound';
                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && <div className={styles.WhatsappChatHistory__dateDivider}><span>{formatDate(msg.created_at)}</span></div>}
                                <div className={`${styles.WhatsappChatHistory__bubbleWrapper} ${isOutbound ? styles.WhatsappChatHistory__bubbleWrapperOutbound : styles.WhatsappChatHistory__bubbleWrapperInbound}`}>
                                    <div className={`${styles.WhatsappChatHistory__bubble} ${isOutbound ? styles.WhatsappChatHistory__bubbleOutbound : styles.WhatsappChatHistory__bubbleInbound}`}>
                                        <p className={styles.WhatsappChatHistory__text}><MessageBody body={msg.body} /></p>
                                        <div className={styles.WhatsappChatHistory__meta}>
                                            <span className={styles.WhatsappChatHistory__time}>{formatTime(msg.created_at)}</span>
                                            {isOutbound && (
                                                <span 
                                                    className={`${styles.WhatsappChatHistory__status} ${msg.status === 'delivered' ? styles.WhatsappChatHistory__statusDelivered : msg.status === 'failed' ? styles.WhatsappChatHistory__statusFailed : ''}`}
                                                    title={msg.status === 'failed' ? 'Error al enviar por WhatsApp' : ''}
                                                >
                                                    <Icon name={msg.status === 'delivered' ? 'done_all' : msg.status === 'failed' ? 'error_outline' : 'done'} size="12px" />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {suggestedSlot && (
                <div className={styles.WhatsappChatHistory__suggestedSlotBanner}>
                    <div className={styles.WhatsappChatHistory__suggestedSlotInfo}>
                        <Icon name="event_available" size="1.25rem" className={styles.WhatsappChatHistory__suggestedSlotIcon} />
                        <div className={styles.WhatsappChatHistory__suggestedSlotContent}>
                            <div className={styles.WhatsappChatHistory__suggestedSlotLabel}>
                                {t('suggested_slot_label', 'Turno sugerido en agenda:')}
                            </div>
                            <div className={styles.WhatsappChatHistory__suggestedSlotDetails}>
                                {suggestedSlot.dayName ? `${suggestedSlot.dayName} ` : ''}
                                <strong>{suggestedSlot.date}</strong> a las <strong>{suggestedSlot.time} hs</strong>
                                {suggestedSlot.doctorName ? ` • ${suggestedSlot.doctorName}` : ''}
                            </div>
                        </div>
                    </div>
                    <div className={styles.WhatsappChatHistory__suggestedSlotActions}>
                        <button
                            type="button"
                            className={styles.WhatsappChatHistory__suggestedSlotCalendarBtn}
                            onClick={() => handleViewInCalendar(suggestedSlot)}
                            title={t('view_in_calendar', 'Ver en Calendario')}
                        >
                            <Icon name="calendar_month" size="1rem" />
                            <span>{t('view_in_calendar', 'Ver en Calendario')}</span>
                        </button>
                        <button
                            type="button"
                            className={styles.WhatsappChatHistory__suggestedSlotDismissBtn}
                            onClick={() => dispatch({ type: 'CLEAR_SUGGESTED_SLOT' })}
                            title={t('dismiss_suggestion', 'Descartar')}
                            aria-label={t('dismiss_suggestion', 'Descartar')}
                        >
                            <Icon name="close" size="1rem" />
                        </button>
                    </div>
                </div>
            )}

            <form className={`${styles.WhatsappChatHistory__inputArea}`} onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <textarea
                    className={`${styles.WhatsappChatHistory__input} ${styles.WhatsappChatHistory__textarea}`}
                    placeholder={t('write_message')}
                    value={newMessage}
                    rows={newMessage.length > 70 || newMessage.includes('\n') ? 3 : 1}
                    onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    disabled={sending}
                />
                <button 
                    type="button" 
                    className={`${styles.WhatsappChatHistory__aiBtn} ${aiLoading ? styles.WhatsappChatHistory__aiBtnLoading : ''}`}
                    onClick={handleGetAiSuggestion}
                    title={t('ai_suggestion')}
                    disabled={aiLoading || sending}
                >
                    <Icon name="auto_awesome" size="1.2rem" />
                </button>
                <button
                    type="submit"
                    className={`${styles.WhatsappChatHistory__sendBtn}`}
                    disabled={sending || !newMessage.trim()}
                    aria-label={t('send_message')}
                >
                    <Icon name="send" size="1.2rem" />
                </button>
            </form>
        </section>
    );
};

