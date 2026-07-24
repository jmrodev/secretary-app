import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import { parseDate, isToday, formatTime, formatDate as formatUtil } from '@/utils/core/dateUtils';
import styles from './ChatWindow.module.css';

/**
 * ChatWindow Component (Feature Component).
 * Renders the full-screen view of a chat thread.
 */
const ChatWindow = ({
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

    const formatDate = (dateString) => {
        const date = parseDate(dateString);
        return isToday(date)
            ? formatTime(date, { hour12: false })
            : formatUtil(date, { hideYear: true });
    };

    if (!selectedConvo) {
        return (
            <section className={`${styles.root} ${styles.empty}`}>
                <div className={`${styles.emptyIcon}`}><Icon name="chat" size="4rem" /></div>
                <h2 className={`${styles.emptyTitle}`}>Tus Mensajes</h2>
                <p className={`${styles.emptyText}`}>Selecciona una conversación de la lista para empezar a chatear o busca un contacto para iniciar un nuevo chat.</p>
            </section>
        );
    }

    return (
        <section className={`${styles.root}`}>
            {/* Header */}
            <header className={`${styles.header}`}>
                {/* Back button for mobile navigation */}
                <button className={`${styles.backButton}`} onClick={onBack} title="Volver a la lista">
                    <Icon name="arrow_back" />
                </button>

                <div className={`${styles.convoAvatar}`}>
                    {selectedConvo.other_display_name ? selectedConvo.other_display_name[0].toUpperCase() : '?'}
                </div>
                <div className={`${styles.headerInfo}`}>
                    <h3 className={`${styles.headerTitle}`}>{selectedConvo.other_display_name || selectedConvo.other_username}</h3>
                    <small className={`${styles.headerSubtitle}`}>{selectedConvo.subject || 'Conversación activa'}</small>
                </div>
            </header>

            {/* Messages Area */}
            <section className={`${styles.messages}`} ref={scrollRef}>
                {loading ? (
                    <div className={`${styles.messagesStatus}`}>
                        <Loading size="md" />
                    </div>
                ) : thread.length === 0 ? (
                    <div className={`${styles.messagesStatus} ${styles.messagesStatusEmpty}`}>
                        <div className={`${styles.emptyIcon}`}><Icon name="waving_hand" size="2rem" /></div>
                        <p>¡Dile hola!</p>
                    </div>
                ) : (
                    thread.map(msg => (
                        <article key={msg.id} className={`${styles.bubble} ${msg.sender_id === user?.user_id ? styles.bubbleSent : styles.bubbleReceived}`}>
                            <div className={`${styles.bubbleContent}`}>
                                {msg.message}
                                <span className={`${styles.bubbleTime}`}>{formatDate(msg.created_at)}</span>
                            </div>
                        </article>
                    ))
                )}
            </section>

            {/* Input Area */}
            <footer className={`${styles.footer}`}>
                <form className={`${styles.inputArea}`} onSubmit={onSendMessage}>
                    <div className={`${styles.inputWrapper}`}>
                        <input
                            type="text"
                            placeholder="Escribe un mensaje aquí..."
                            className={`${styles.input}`}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={sending}
                        />
                    </div>
                    <Button
                        type="submit"
                        className={`${styles.sendButton}`}
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

export default ChatWindow;
