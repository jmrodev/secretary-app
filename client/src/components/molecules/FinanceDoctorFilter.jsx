
import React from 'react';
import Button from '../atoms/Button';

const FinanceDoctorFilter = ({
    doctors,
    selectedDoctorFilter,
    setSelectedDoctorFilter,
    t
}) => {
    return (
        <nav className="tab-nav">
            <Button
                variant="ghost"
                className={`tab-nav__item ${selectedDoctorFilter === '' ? 'tab-nav__item--active' : ''}`}
                onClick={() => setSelectedDoctorFilter('')}
            >
                👥 {t('all_doctors')}
            </Button>
            {doctors.map(d => (
                <Button
                    key={d.id}
                    variant="ghost"
                    className={`tab-nav__item ${selectedDoctorFilter == d.id ? 'tab-nav__item--active' : ''}`}
                    onClick={() => setSelectedDoctorFilter(String(d.id))}
                >
                    👨‍⚕️ {d.full_name}
                </Button>
            ))}
        </nav>
    );
};

export default FinanceDoctorFilter;
