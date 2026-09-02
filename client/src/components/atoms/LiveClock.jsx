import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useLiveClock } from '@/hooks/useLiveClock';
import styles from './LiveClock.module.css';

/**
 * LiveClock - Atom component to display real-time date and time.
 * Fully internationalized and formatted with tabular numbers.
 */
export const LiveClock = ({ className = '', hideDate = false, premium: _premium = false }) => {
    const time = useLiveClock();
    const { language } = useLanguage();
    const locale = language === 'en' ? 'en-US' : 'es-AR';

    const dateLabel = time.toLocaleDateString(locale, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });

    const timeLabel = time.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const rootClass = [
        styles.LiveClock__root,
        styles.LiveClock__prominent,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={rootClass} suppressHydrationWarning>
            <span className={styles.LiveClock__liveDot} aria-hidden="true" />
            <Icon name="schedule" size="1.05rem" className={styles.LiveClock__icon} />
            {!hideDate && <span className={styles.LiveClock__date}>{dateLabel}</span>}
            {!hideDate && <span className={styles.LiveClock__separator}>|</span>}
            <span className={styles.LiveClock__time}>{timeLabel}</span>
        </div>
    );
};
