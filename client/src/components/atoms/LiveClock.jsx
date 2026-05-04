import React from 'react';
import { useLiveClock } from '@/hooks/useLiveClock';
import './LiveClock.css';

/**
 * LiveClock - Atom component to display real-time date and time.
 */
const LiveClock = ({ className = '' }) => {
    const time = useLiveClock();

    const dateLabel = time.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const timeLabel = time.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    return (
        <div className={`live-clock ${className}`}>
            <span className="live-clock__date">{dateLabel}</span>
            <span className="live-clock__separator">·</span>
            <span className="live-clock__time">{timeLabel}</span>
        </div>
    );
};

export default LiveClock;
