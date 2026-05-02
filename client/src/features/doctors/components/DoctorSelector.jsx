import React from 'react';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/context/LanguageContext';
import { useDoctors } from '@/context/DoctorContextDefinition';
import './DoctorSelector.css';

/**
 * DoctorSelector (Organism).
 * A specialized selection component for headers and toolbars.
 * Features high-contrast pill styling for premium headers.
 * Consumes global DoctorContext.
 */
const DoctorSelector = () => {
    const { t } = useLanguage();
    const { viewDoctorId, setViewDoctorId, doctors, isStaff, doctorDisplayName } = useDoctors();

    if (!isStaff) {
        return doctorDisplayName ? (
            <strong className="doctor-selector-display-name">
                ({t('doctor')}: {doctorDisplayName})
            </strong>
        ) : null;
    }

    return (
        <span className="doctor-inline-selector">
            <Icon name="medical_services" size="1rem" />
            <Select
                variant="ghost"
                size="sm"
                value={viewDoctorId || ''}
                onChange={(e) => setViewDoctorId(e.target.value)}
                options={[
                    { value: '', label: t('all_doctors') },
                    ...doctors.map(d => ({ value: d.id, label: d.full_name }))
                ]}
                className="doctor-inline-selector__select"
            />
        </span>
    );
};

export default DoctorSelector;
