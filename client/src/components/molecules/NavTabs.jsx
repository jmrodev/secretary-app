import React from 'react';
import TabButton from '../atoms/TabButton';

const NavTabs = ({ activeTab, setActiveTab, userRole }) => {
    return (
        <div className="top-nav-tabs mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="tabs-container" style={{ margin: 0 }}>
                <TabButton
                    isActive={activeTab === 'calendar'}
                    onClick={() => setActiveTab('calendar')}
                    variant="pill"
                >
                    📅 Agenda
                </TabButton>
                <TabButton
                    isActive={activeTab === 'upcoming'}
                    onClick={() => setActiveTab('upcoming')}
                    variant="pill"
                >
                    📋 Próximos Turnos
                </TabButton>
                <TabButton
                    isActive={activeTab === 'monthly'}
                    onClick={() => setActiveTab('monthly')}
                    variant="pill"
                >
                    🗓️ Vista Mensual
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
            <div className="action-bar-buttons-container">
            </div>
        </div>
    );
};

export default NavTabs;
