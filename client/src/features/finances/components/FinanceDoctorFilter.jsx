import React from 'react';
import TabButton from '../../../components/atoms/TabButton';
import Icon from '../../../components/atoms/Icon';
import TabNav from '../../../components/molecules/TabNav';
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
                    icon={<Icon name="groups" size="1.1rem" />}
                >
                    {t('all_doctors')}
                </TabButton>
                {doctors.map(d => (
                    <TabButton
                        key={d.id}
                        isActive={selectedDoctorFilter == d.id}
                        onClick={() => setSelectedDoctorFilter(String(d.id))}
                        className="finance-doctor-filter__item"
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

export default FinanceDoctorFilter;
