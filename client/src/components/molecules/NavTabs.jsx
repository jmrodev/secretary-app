import React from 'react';
import TabButton from '@/components/atoms/TabButton';
import TabNav from '@/components/molecules/TabNav';
import Icon from '@/components/atoms/Icon';

const NavTabs = ({ activeTab, setActiveTab, userRole, isStaff, isAdmin }) => {
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
            {isStaff && (
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
