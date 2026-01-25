
import React from 'react';
import Button from '../atoms/Button';

const FinanceDoctorFilter = ({
    doctors,
    selectedDoctorFilter,
    setSelectedDoctorFilter,
    t
}) => {
    return (
        <div className="tabs-container mb-6 max-w-full overflow-x-auto custom-scrollbar flex-nowrap pb-2">
            <Button
                variant="ghost"
                className={`tab-btn whitespace-nowrap ${selectedDoctorFilter === '' ? 'active' : ''}`}
                onClick={() => setSelectedDoctorFilter('')}
            >
                👥 {t('all_doctors')}
            </Button>
            {doctors.map(d => (
                <Button
                    key={d.id}
                    variant="ghost"
                    className={`tab-btn whitespace-nowrap ${selectedDoctorFilter == d.id ? 'active' : ''}`}
                    onClick={() => setSelectedDoctorFilter(String(d.id))}
                >
                    👨‍⚕️ {d.full_name}
                </Button>
            ))}
        </div>
    );
};

export default FinanceDoctorFilter;
