import React from 'react';
import TabButton from '../atoms/TabButton';

const DoctorFilter = ({ activeTab, userRole, viewDoctorId, setViewDoctorId, doctors }) => {
    // Show filter on monthly view as well
    if ((activeTab !== 'calendar' && activeTab !== 'upcoming' && activeTab !== 'monthly') || userRole !== 'secretary') {
        return null;
    }

    return (
        <div
            className={`header-actions-container mb-8 ${viewDoctorId ? `doctor-color-${Number(viewDoctorId) % 10} doctor-themed-bg` : ''}`}
            style={viewDoctorId ? { borderRadius: '1rem', padding: '1rem 1.5rem', marginTop: '-1.5rem', borderTop: 'none' } : { marginTop: '-1.5rem', borderTop: 'none' }}
        >
            <div className="tabs-container" style={{ margin: 0, padding: '0.25rem' }}>
                <TabButton
                    isActive={!viewDoctorId}
                    onClick={() => setViewDoctorId('')}
                    className="tab-btn-small"
                >
                    🏢 Todos
                </TabButton>
                {doctors.map(d => (
                    <TabButton
                        key={d.id}
                        isActive={viewDoctorId == d.id}
                        onClick={() => setViewDoctorId(d.id)}
                        className="tab-btn-small"
                        title={d.specialty}
                    >
                        👨‍⚕️ {d.full_name.split(' ').slice(0, 2).join(' ')}
                    </TabButton>
                ))}
            </div>
        </div>
    );
};

export default DoctorFilter;
