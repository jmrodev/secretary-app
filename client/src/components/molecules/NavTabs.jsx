import React from 'react';
import TabButton from '../atoms/TabButton';
import TabNav from './TabNav';
import Icon from '../atoms/Icon';

const NavTabs = ({ activeTab, setActiveTab, userRole }) => {
    return (
        <TabNav className="nav-tabs--top">
            <TabButton
                isActive={activeTab === 'calendar'}
                onClick={() => setActiveTab('calendar')}
                variant="pill"
                icon={<Icon name="calendar_month" size="1.1rem" />}
            >
                Agenda
            </TabButton>
            {(userRole === 'admin' || userRole === 'secretary') && (
                <TabButton
                    isActive={activeTab === 'holidays'}
                    onClick={() => setActiveTab('holidays')}
                    variant="pill"
                    icon={<Icon name="beach_access" size="1.1rem" />}
                >
                    Feriados
                </TabButton>
            )}
        </TabNav>
    );
};

export default NavTabs;
