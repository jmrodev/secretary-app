import React from 'react';
import { useLiveClock } from '@/hooks/useLiveClock';
import styles from './LiveClock.module.css';

/**
 * LiveClock - Atom component to display real-time date and time.
 */
const LiveClock = ({ className = '', hideDate = false, premium = false }) => {
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

    const rootClass = [styles.root, premium ? styles.premium : '', className].filter(Boolean).join(' ');

    return (
        <div className={rootClass}>
            {!hideDate && <span className={`${styles.date}`}>{dateLabel}</span>}
            {!hideDate && <span className={`${styles.separator}`}>·</span>}
            <span className={`${styles.time}`}>{timeLabel}</span>
        </div>
    );
};

export default LiveClock;
