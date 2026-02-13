import React from 'react';
import TabButton from '../atoms/TabButton';
import TabNav from './TabNav';

const NavTabs = ({ activeTab, setActiveTab, userRole }) => {
    return (
        <TabNav className="nav-tabs--top">
            <TabButton
                isActive={activeTab === 'calendar'}
                onClick={() => setActiveTab('calendar')}
                variant="pill"
            >
                📅 Agenda
            </TabButton>
            {(userRole === 'admin' || userRole === 'secretary') && (
                <TabButton
                    isActive={activeTab === 'holidays'}
                    onClick={() => setActiveTab('holidays')}
                    variant="pill"
                >
                    🏖️ Feriados
                </TabButton>
            )}
        </TabNav>
    );
};

export default NavTabs;
