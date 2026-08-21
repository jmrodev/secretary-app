import React from 'react';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';
import { Icon } from '@/components/atoms/Icon';
import sharedStyles from '@/styles/shared.module.css';
import styles from './FeatureToolbar.module.css';

const EMPTY_ARRAY = [];

/**
 * FeatureToolbar Organism.
 * A generic, reusable horizontal bar for feature orchestration.
 * Centralizes navigation tabs and contextual actions.
 */
export const FeatureToolbar = ({
    tabs = EMPTY_ARRAY,
    activeTab,
    onTabChange,
    search,
    actions,
    className = ''
}) => {
    return (
        <div className={`${styles.FeatureToolbar__root} ${className} ${sharedStyles.AnimateFadeIn} no-print`}>
            <div className={`${styles.FeatureToolbar__content}`}>
                {tabs.length > 0 && (
                    <TabNav className={styles.FeatureToolbar__tabs}>
                        {tabs.map(tab => (
                            <TabButton
                                key={tab.id}
                                isActive={activeTab === tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={styles.FeatureToolbar__tabButton}
                                icon={tab.icon && <Icon name={tab.icon} size="1.1rem" />}
                            >
                                {tab.label}
                                {tab.badge && <span className={styles.FeatureToolbar__badge}>{tab.badge}</span>}
                            </TabButton>
                        ))}
                    </TabNav>
                )}

                {search && (
                    <div className={styles.FeatureToolbar__search}>
                        {search}
                    </div>
                )}

                {actions && (
                    <div className={`${styles.FeatureToolbar__actions}`}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

