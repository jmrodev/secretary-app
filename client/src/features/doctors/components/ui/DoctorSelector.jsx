import React from 'react';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useDoctors } from '@/context/DoctorContextDefinition';
import styles from './DoctorSelector.module.css';

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
            <strong className={`${styles.doctorSelectorDisplayName}`}>
                ({t('doctor')}: {doctorDisplayName})
            </strong>
        ) : null;
    }

    return (
        <span className={`${styles.root}`}>
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
                className={`${styles.select}`}
            />
        </span>
    );
};

export default DoctorSelector;
