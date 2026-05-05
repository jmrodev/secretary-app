import { useState, useEffect } from 'react';

/**
 * useLiveClock - Hook to manage a real-time clock.
 * @returns {Date} current time
 */
export const useLiveClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return time;
};
