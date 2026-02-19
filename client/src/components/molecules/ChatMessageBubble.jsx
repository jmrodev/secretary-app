import React from 'react';
import Icon from '../atoms/Icon';

/**
 * ChatMessageBubble Molecule.
 * Renders a single message bubble with text, timestamp, and read status ticks.
 */
const ChatMessageBubble = ({ msg, isSent, formatDate, renderTicks }) => {
    return (
        <div className={`floating-chat__bubble ${isSent ? 'floating-chat__bubble--sent' : 'floating-chat__bubble--received'}`}>
            <div className="floating-chat__bubble-text">{msg.message}</div>
            <div className="floating-chat__bubble-footer">
                <span className="floating-chat__time">{formatDate(msg.created_at)}</span>
                {isSent && renderTicks(msg.read_status)}
            </div>
        </div>
    );
};

export default ChatMessageBubble;
