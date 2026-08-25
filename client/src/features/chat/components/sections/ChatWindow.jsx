import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
import { useLanguage } from '@/hooks/useLanguage';
import { parseDate, isToday, formatTime, formatDate as formatUtil } from '@/utils/core/dateUtils';
import styles from './ChatWindow.module.css';

const formatDate = (dateString) => {
    const date = parseDate(dateString);
    return isToday(date)
        ? formatTime(date, { hour12: false })
        : formatUtil(date, { hideYear: true });
};

/**
 * ChatWindow Component (Feature Component).
 * Renders the full-screen view of a chat thread.
 */
export const ChatWindow = ({
    selectedConvo,
    thread,
    user,
    loading,
    sending,
    messageText,
    setMessageText,
    onSendMessage,
    scrollRef,
    onBack // Added onBack prop
}) => {
    const { t } = useLanguage();

    if (!selectedConvo) {
        return (
            <section className={`${styles.ChatWindow__root} ${styles.ChatWindow__empty}`}>
                <div className={`${styles.ChatWindow__emptyIcon}`}><Icon name="chat" size="4rem" /></div>
                <h2 className={`${styles.ChatWindow__emptyTitle}`}>{t('your_messages') || 'Tus Mensajes'}</h2>
                <p className={`${styles.ChatWindow__emptyText}`}>{t('select_convo_hint') || 'Selecciona una conversación de la lista para empezar a chatear o busca un contacto para iniciar un nuevo chat.'}</p>
            </section>
        );
    }

    return (
        <section className={`${styles.ChatWindow__root}`}>
            {/* Header */}
            <header className={`${styles.ChatWindow__header}`}>
                {/* Back button for mobile navigation */}
                <button type="button" className={`${styles.ChatWindow__backButton}`} onClick={onBack} title={t('back_to_list') || "Volver a la lista"}>
                    <Icon name="arrow_back" />
                </button>

                <div className={`${styles.ChatWindow__convoAvatar}`}>
                    {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                </div>
                <div className={`${styles.ChatWindow__headerInfo}`}>
                    <h3 className={`${styles.ChatWindow__headerTitle}`}>{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                    <small className={`${styles.ChatWindow__headerSubtitle}`}>{selectedConvo.subject || (t('active_conversation') || 'Conversación activa')}</small>
                </div>
            </header>

            {/* Messages Area */}
            <section className={`${styles.ChatWindow__messages}`} ref={scrollRef}>
                {loading ? (
                    <div className={`${styles.ChatWindow__messagesStatus}`}>
                        <Loading size="md" />
                    </div>
                ) : thread.length === 0 ? (
                    <div className={`${styles.ChatWindow__messagesStatus} ${styles.ChatWindow__messagesStatusEmpty}`}>
                        <div className={`${styles.ChatWindow__emptyIcon}`}><Icon name="waving_hand" size="2rem" /></div>
                        <p>{t('say_hello') || '¡Dile hola!'}</p>
                    </div>
                ) : (
                    thread.map(msg => (
                        <article key={msg.id} className={`${styles.ChatWindow__bubble} ${msg.sender_id === user?.user_id ? styles.ChatWindow__bubbleSent : styles.ChatWindow__bubbleReceived}`}>
                            <div className={`${styles.ChatWindow__bubbleContent}`}>
                                {msg.message}
                                <span className={`${styles.ChatWindow__bubbleTime}`}>{formatDate(msg.created_at)}</span>
                            </div>
                        </article>
                    ))
                )}
            </section>

            {/* Input Area */}
            <footer className={`${styles.ChatWindow__footer}`}>
                <form className={`${styles.ChatWindow__inputArea}`} onSubmit={onSendMessage}>
                    <div className={`${styles.ChatWindow__inputWrapper}`}>
                        <label htmlFor="chat-message" className={`${styles.ChatWindow__label}`}>
                            {t('write_message') || 'Escribe un mensaje'}
                        </label>
                        <input
                            id="chat-message"
                            type="text"
                            placeholder={t('write_message_here_placeholder') || "Escribe un mensaje aquí..."}
                            className={`${styles.ChatWindow__input}`}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={sending}
                        />
                    </div>
                    <Button
                        type="submit"
                        className={`${styles.ChatWindow__sendButton}`}
                        disabled={sending || !messageText.trim()}
                        variant="primary"
                    >
                        {sending ? <Loading variant="inline" size="sm" /> : <Icon name="send" size="1.1rem" />}
                    </Button>
                </form>
            </footer>
        </section>
    );
};
