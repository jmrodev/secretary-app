import { useState, useEffect, useRef } from 'react';

/**
 * useDynamicPageSize Hook
 * Measures available vertical space in a container and calculates optimal pageSize
 * so rows fit precisely within the viewport without triggering vertical scrollbars.
 *
 * @param {Object} options
 * @param {number} options.rowHeight Estimated height per row in px (default 52)
 * @param {number} options.headerOffset Space reserved for table header and pagination in px (default 110)
 * @param {number} options.defaultSize Fallback pageSize (default 12)
 * @param {number} options.minSize Minimum items per page (default 5)
 * @param {number} options.maxSize Maximum items per page (default 30)
 */
export const useDynamicPageSize = ({
    rowHeight = 52,
    headerOffset = 110,
    defaultSize = 12,
    minSize = 5,
    maxSize = 30
} = {}) => {
    const containerRef = useRef(null);
    const [pageSize, setPageSize] = useState(defaultSize);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;

        const updateSize = () => {
            const height = container.clientHeight;
            if (height > 0) {
                const usableHeight = Math.max(0, height - headerOffset);
                const computed = Math.floor(usableHeight / rowHeight);
                const clamped = Math.max(minSize, Math.min(maxSize, computed));
                setPageSize((prev) => (prev !== clamped ? clamped : prev));
            }
        };

        updateSize();

        const observer = new ResizeObserver(() => {
            updateSize();
        });

        observer.observe(container);

        return () => {
            observer.disconnect();
        };
    }, [rowHeight, headerOffset, minSize, maxSize]);

    return { containerRef, pageSize };
};
