import { useState, useEffect } from 'react';

/**
 * Hook to safely handle date formatting in React 19 to avoid hydration mismatches.
 * Returns null initially and the formatted date after mount.
 */
export const useClientDate = (date, formatFn) => {
    const [formatted, setFormatted] = useState(null);

    useEffect(() => {
        if (!date) return;
        setFormatted(formatFn(new Date(date)));
    }, [date, formatFn]);

    return formatted;
};
