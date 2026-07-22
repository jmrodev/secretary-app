import React, { useMemo } from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useMessage } from '@/context/MessageContext';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import { useWhatsappChatController } from '@/features/patients/hooks/useWhatsappChatController';
import styles from './WhatsappChatHistory.module.css';

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,:;!?)}\]])/g;

const linkify = (text) => {
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = URL_REGEX.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        parts.push(
            <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer">{match[0]}</a>
        );
        lastIndex = URL_REGEX.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
};

const WhatsappChatHistory = ({ patientId, phone, t, hideHeader = false }) => {
    const { showMessage } = useMessage();
    const {
        state,
        dispatch,
        messagesEndRef,
        handleGetAiSuggestion,
        handleSendMessage,
        fetchHistory
    } = useWhatsappChatController(patientId, phone, showMessage, t);
    
    const { messages, loading, newMessage, sending, aiLoading } = state;

    return (
        <section className={`${styles.root} ${hideHeader ? styles.noHeader : ''}`}>
            {!hideHeader && (
                <header className={styles.header}>
                    <div className={styles.headerInfo}>
                        <Icon name="whatsapp" size="1.2rem" />
                        <h3 className={styles.title}>{t('whatsapp_history')}</h3>
                    </div>
                    <Button size="sm" variant="ghost" onClick={fetchHistory} icon={<Icon name="refresh" size="1rem" />}>
                        {t('refresh')}
                    </Button>
                </header>
            )}
            
            <div className={styles.messages}>
                {loading && messages.length === 0 ? (
                    <div className={styles.loading}>{t('loading')}</div>
                ) : messages.length === 0 ? (
                    <div className={styles.empty}>{t('no_messages_yet')}</div>
                ) : (
                    messages.map((msg, index) => {
                        const showDate = index === 0 || formatDate(messages[index - 1].created_at) !== formatDate(msg.created_at);
                        const isOutbound = msg.direction === 'outbound';
                        const wrapperClass = isOutbound ? styles.bubbleWrapperOutbound : styles.bubbleWrapperInbound;
                        const bubbleClass = isOutbound ? styles.bubbleOutbound : styles.bubbleInbound;
                        const statusClass = msg.status === 'read' ? styles.statusRead 
                            : msg.status === 'delivered' ? styles.statusDelivered 
                            : '';
                        return (
                            <React.Fragment key={msg.id}>
                                {showDate && <div className={styles.dateDivider}><span>{formatDate(msg.created_at)}</span></div>}
                                <div className={`${styles.bubbleWrapper} ${wrapperClass}`}>
                                    <div className={`${styles.bubble} ${bubbleClass}`}>
                                        <p className={styles.text}>{linkify(msg.body)}</p>
                                        <div className={styles.meta}>
                                            <span className={styles.time}>{formatTime(msg.created_at)}</span>
                                            {isOutbound && (
                                                <span className={`${styles.status} ${statusClass}`}>
                                                    <Icon name={msg.status === 'delivered' || msg.status === 'read' ? 'done_all' : 'done'} size="16px" />
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

            <form className={`${styles.inputArea}`} onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <input
                    type="text"
                    className={`${styles.input}`}
                    placeholder={t('write_message')}
                    value={newMessage}
                    onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
                    disabled={sending}
                />
                <button 
                    type="button" 
                    className={`${styles.aiBtn} ${aiLoading ? styles.aiBtnLoading : ''}`}
                    onClick={handleGetAiSuggestion}
                    title={t('ai_suggestion')}
                    disabled={aiLoading || sending}
                >
                    <Icon name="auto_awesome" size="1.2rem" />
                </button>
                <button type="submit" className={`${styles.sendBtn}`} disabled={sending || !newMessage.trim()}>
                    <Icon name="send" size="1.2rem" />
                </button>
            </form>
        </section>
    );
};

export default WhatsappChatHistory;
