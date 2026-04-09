import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import ChatMessageBubble from './ChatMessageBubble';

/**
 * ChatThread Molecule (Feature Component).
 * Renders the active message thread and the input area to send new messages.
 */
const ChatThread = ({
    thread,
    user,
    loading,
    sending,
    messageText,
    isOtherTyping,
    scrollRef,
    formatDate,
    renderTicks,
    handleTyping,
    handleSendMessage
}) => {
    return (
        <>
            <div className="floating-chat__messages" ref={scrollRef}>
                {loading && thread.length === 0 ? (
                    <p className="text-center p-4 text-muted">Cargando...</p>
                ) : (
                    thread.map(msg => (
                        <ChatMessageBubble
                            key={msg.id}
                            msg={msg}
                            isSent={msg.sender_id === user.user_id}
                            formatDate={formatDate}
                            renderTicks={renderTicks}
                        />
                    ))
                )}
                {isOtherTyping && (
                    <div className="floating-chat__bubble floating-chat__bubble--received typing-indicator">
                        <em>Escribiendo...</em>
                    </div>
                )}
            </div>
            <form className="floating-chat__input-area" onSubmit={handleSendMessage}>
                <div className="floating-chat__input-wrapper">
                    <Input
                        placeholder="Responde aquí..."
                        value={messageText}
                        onChange={handleTyping}
                        disabled={sending}
                        size="sm"
                        autoFocus
                    />
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={sending || !messageText.trim()}
                    icon={<Icon name="send" size="1rem" />}
                />
            </form>
        </>
    );
};

export default ChatThread;
