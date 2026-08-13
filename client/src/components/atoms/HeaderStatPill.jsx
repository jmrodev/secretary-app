import React from 'react';
import Icon from '@/components/atoms/Icon';
import styles from './HeaderStatPill.module.css';

/**
 * HeaderStatPill - Atom component for a single dashboard header metric.
 * Pure presentational: renders an icon wrapper, the metric value and a
 * native tooltip title from props. No data fetching, no hooks.
 *
 * @param {string} icon - Icon name from the ICONS configuration.
 * @param {string|number} value - Metric value to display.
 * @param {string} title - Tooltip text exposed as the native title attribute.
 * @param {string} tone - Icon wrapper tone: appointments | week | month | patients | growth.
 */
export const HeaderStatPill = ({ icon, value, title, tone }) => {
    const iconWrapperClass = `${styles.iconWrapper} ${styles[`iconWrapper--${tone}`] || ''}`.trim();

    return (
        <div className={styles.pill} title={title}>
            <div className={iconWrapperClass}>
                <Icon name={icon} size="0.9rem" />
            </div>
            <span className={styles.value}>{value}</span>
        </div>
    );
};

export default HeaderStatPill;