import React from 'react';
import TabButton from '../atoms/TabButton';
import TabNav from './TabNav';
import './FinanceDoctorFilter.css';

const FinanceDoctorFilter = ({
    doctors,
    selectedDoctorFilter,
    setSelectedDoctorFilter,
    t
}) => {
    return (
        <div className="finance-doctor-filter">
            <TabNav className="finance-doctor-filter__list">
                <TabButton
                    isActive={selectedDoctorFilter === ''}
                    onClick={() => setSelectedDoctorFilter('')}
                    className="finance-doctor-filter__item"
                >
                    👥 {t('all_doctors')}
                </TabButton>
                {doctors.map(d => (
                    <TabButton
                        key={d.id}
                        isActive={selectedDoctorFilter == d.id}
                        onClick={() => setSelectedDoctorFilter(String(d.id))}
                        className="finance-doctor-filter__item"
                        title={d.specialty}
                    >
                        👨‍⚕️ {d.full_name.split(' ').slice(0, 2).join(' ')}
                    </TabButton>
                ))}
            </TabNav>
        </div>
    );
};

export default FinanceDoctorFilter;
