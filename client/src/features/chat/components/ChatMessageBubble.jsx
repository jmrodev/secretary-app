import React from 'react';
import Icon from '@/components/atoms/Icon';

/**
 * ChatMessageBubble Molecule (Feature Component).
 * Renders a single message bubble with text, timestamp, and read status ticks.
 */
const ChatMessageBubble = ({ msg, isSent, formatDate, renderTicks }) => {
    return (
        <article className={`floating-chat__bubble ${isSent ? 'floating-chat__bubble--sent' : 'floating-chat__bubble--received'}`}>
            <h4 className="visually-hidden">Mensaje</h4>
            <div className="floating-chat__bubble-text">{msg.message}</div>
            <div className="floating-chat__bubble-footer">
                <span className="floating-chat__time">{formatDate(msg.created_at)}</span>
                {isSent && renderTicks(msg.read_status)}
            </div>
        </article>
    );
};

export default ChatMessageBubble;
