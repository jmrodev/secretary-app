import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './PendingBookingBanner.module.css';

/**
 * PendingBookingBanner Molecule.
 * Collapsed trigger for the pending-approval queue (RescheduleBanner pattern:
 * fixed bottom-center, backdrop blur, z-index 1000). Renders nothing when
 * there is nothing to approve and the queue is collapsed.
 */
export const PendingBookingBanner = ({ count = 0, expanded = false, loading = false, onToggle }) => {
    const { t } = useLanguage();

    if (count === 0 && !expanded) return null;

    const label = count === 1
        ? t('pending_approval_banner_one', { count })
        : t('pending_approval_banner_many', { count });

    return (
        <button
            type="button"
            className={`${styles.PendingBookingBanner__root} ${expanded ? styles.PendingBookingBanner__rootExpanded : ''}`}
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={t(expanded ? 'pending_approval_close' : 'pending_approval_open')}
        >
            <Icon name="NOTIFICATIONS" size="1.1rem" className={styles.PendingBookingBanner__icon} />
            <span className={styles.PendingBookingBanner__label}>{label}</span>
            {loading && <span className={styles.PendingBookingBanner__loading} aria-hidden="true" />}
            <Icon name={expanded ? 'EXPAND_LESS' : 'EXPAND_MORE'} size="1.1rem" className={styles.PendingBookingBanner__chevron} />
        </button>
    );
};
