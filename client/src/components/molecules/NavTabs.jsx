import React from 'react';
import TabButton from '@/components/atoms/TabButton';
import TabNav from '@/components/molecules/TabNav';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/context/LanguageContext';

const NavTabs = ({ activeTab, setActiveTab, userRole, isStaff, isAdmin }) => {
    const { t } = useLanguage();

    return (
        <TabNav className="nav-tabs--header">
            <TabButton
                isActive={activeTab === 'calendar'}
                onClick={() => setActiveTab('calendar')}
                variant="pill"
                icon={<Icon name="view_day" size="1.1rem" />}
            >
                {t('view_today')}
            </TabButton>
            <TabButton
                isActive={activeTab === 'upcoming'}
                onClick={() => setActiveTab('upcoming')}
                variant="pill"
                icon={<Icon name="view_list" size="1.1rem" />}
            >
                {t('upcoming_appointments')}
            </TabButton>
            <TabButton
                isActive={activeTab === 'monthly'}
                onClick={() => setActiveTab('monthly')}
                variant="pill"
                icon={<Icon name="calendar_month" size="1.1rem" />}
            >
                {t('view_month')}
            </TabButton>
            {isStaff && (
                <TabButton
                    isActive={activeTab === 'holidays'}
                    onClick={() => setActiveTab('holidays')}
                    variant="pill"
                    icon={<Icon name="beach_access" size="1.1rem" />}
                >
                    {t('holidays')}
                </TabButton>
            )}
        </TabNav>
    );
};

export default NavTabs;
