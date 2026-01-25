import React from 'react';

const NavTabs = ({ activeTab, setActiveTab, userRole }) => {
    return (
        <div className="top-nav-tabs mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="tabs-container" style={{ margin: 0 }}>
                <button
                    className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    📅 Agenda
                </button>
                <button
                    className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    📋 Próximos Turnos
                </button>
                {(userRole === 'admin' || userRole === 'secretary') && (
                    <button
                        className={`tab-btn ${activeTab === 'holidays' ? 'active' : ''}`}
                        onClick={() => setActiveTab('holidays')}
                    >
                        🏖️ Feriados
                    </button>
                )}
            </div>
            <div className="action-bar-buttons-container">
            </div>
        </div>
    );
};

export default NavTabs;
