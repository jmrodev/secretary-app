import React from 'react';
import TabButton from '../../../components/atoms/TabButton';
import Icon from '../../../components/atoms/Icon';
import TabNav from '../../../components/molecules/TabNav';
import './DoctorFilter.css';

const DoctorFilter = ({ activeTab, userRole, viewDoctorId, setViewDoctorId, doctors }) => {
    // Show filter on monthly view as well
    if ((activeTab !== 'calendar' && activeTab !== 'upcoming' && activeTab !== 'monthly') || userRole !== 'secretary') {
        return null;
    }

    const isThemed = !!viewDoctorId;
    const themeClass = isThemed ? `doctor-color-${Number(viewDoctorId) % 10} doctor-themed-bg` : '';

    return (
        <div className={`doctor-filter ${isThemed ? 'doctor-filter--themed' : ''} ${themeClass}`}>
            <TabNav className="doctor-filter__tabs">
                <TabButton
                    isActive={!viewDoctorId}
                    onClick={() => setViewDoctorId('')}
                    size="sm"
                    className="doctor-filter__tab"
                    icon={<Icon name="groups" size="1.1rem" />}
                >
                    Todos
                </TabButton>
                {doctors.map(d => (
                    <TabButton
                        key={d.id}
                        isActive={viewDoctorId == d.id}
                        onClick={() => setViewDoctorId(d.id)}
                        size="sm"
                        className="doctor-filter__tab"
                        title={d.specialty}
                        icon={<Icon name="medical_services" size="1.1rem" />}
                    >
                        {d.full_name.split(' ').slice(0, 2).join(' ')}
                    </TabButton>
                ))}
            </TabNav>
        </div>
    );
};

export default DoctorFilter;
