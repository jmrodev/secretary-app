import React from 'react';

const DoctorFilter = ({ activeTab, userRole, viewDoctorId, setViewDoctorId, doctors }) => {
    if ((activeTab !== 'calendar' && activeTab !== 'upcoming') || userRole !== 'secretary') {
        return null;
    }

    return (
        <div
            className={`header-actions-container mb-8 ${viewDoctorId ? `doctor-color-${Number(viewDoctorId) % 10} doctor-themed-bg` : ''}`}
            style={viewDoctorId ? { borderRadius: '1rem', padding: '1rem 1.5rem', marginTop: '-1.5rem', borderTop: 'none' } : { marginTop: '-1.5rem', borderTop: 'none' }}
        >
            <div className="tabs-container" style={{ margin: 0, padding: '0.25rem' }}>
                <button
                    className={`tab-btn-small ${!viewDoctorId ? 'active' : ''}`}
                    onClick={() => setViewDoctorId('')}
                >
                    🏢 Todos
                </button>
                {doctors.map(d => (
                    <button
                        key={d.id}
                        className={`tab-btn-small ${viewDoctorId == d.id ? 'active' : ''}`}
                        onClick={() => setViewDoctorId(d.id)}
                        title={d.specialty}
                    >
                        👨‍⚕️ {d.full_name.split(' ').slice(0, 2).join(' ')}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DoctorFilter;
