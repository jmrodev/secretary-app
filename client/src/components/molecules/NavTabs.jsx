import React from 'react';
import TabButton from '../atoms/TabButton';

const NavTabs = ({ activeTab, setActiveTab, userRole }) => {
    return (
        <div className="nav-tabs nav-tabs--top mb-6">
            <div className="nav-tabs__container">
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
            </div>
            <div className="nav-tabs__actions">
            </div>
        </div>
    );
};

export default NavTabs;
