import { useState, useEffect } from 'react';
import { getNow } from '../utils/core/dateUtils';

/**
 * useLiveClock - Hook to manage a real-time clock.
 * @returns {Date} current time
 */
export const useLiveClock = () => {
    const [time, setTime] = useState(() => getNow());

    useEffect(() => {
        const timer = setInterval(() => setTime(getNow()), 1000);
        return () => clearInterval(timer);
    }, []);

    return time;
};
