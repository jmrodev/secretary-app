import React from 'react';
import { TabNav } from '@/components/molecules/TabNav';
import { TabButton } from '@/components/atoms/TabButton';
import { Icon } from '@/components/atoms/Icon';
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
        <div className={`${styles.root} ${className} animate-fade-in no-print`}>
            <div className={`${styles.content}`}>
                {tabs.length > 0 && (
                    <TabNav className="feature-toolbar__tabs tab-nav--no-margin">
                        {tabs.map(tab => (
                            <TabButton
                                key={tab.id}
                                isActive={activeTab === tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className="feature-toolbar__tab-button"
                                icon={tab.icon && <Icon name={tab.icon} size="1.1rem" />}
                            >
                                {tab.label}
                                {tab.badge && <span className={styles.badge}>{tab.badge}</span>}
                            </TabButton>
                        ))}
                    </TabNav>
                )}

                {search && (
                    <div className={styles.search}>
                        {search}
                    </div>
                )}

                {actions && (
                    <div className={`${styles.actions}`}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

