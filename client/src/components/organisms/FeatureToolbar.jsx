import React from 'react';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import Icon from '@/components/atoms/Icon';
import './FeatureToolbar.css';

/**
 * FeatureToolbar Organism.
 * A generic, reusable horizontal bar for feature orchestration.
 * Centralizes navigation tabs and contextual actions.
 */
const FeatureToolbar = ({
    tabs = [],
    activeTab,
    onTabChange,
    actions,
    className = ''
}) => {
    return (
        <div className={`feature-toolbar ${className} animate-fade-in no-print`}>
            <div className="feature-toolbar__content">
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
                                {tab.badge && <span className="feature-toolbar__badge">{tab.badge}</span>}
                            </TabButton>
                        ))}
                    </TabNav>
                )}

                {actions && (
                    <div className="feature-toolbar__actions">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeatureToolbar;
