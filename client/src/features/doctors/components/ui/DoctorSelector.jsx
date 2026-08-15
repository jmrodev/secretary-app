import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useDoctors } from '@/context/DoctorContextDefinition';
import styles from './DoctorSelector.module.css';

/**
 * ECC-Pattern: Optimized DoctorSelector.
 * Custom dropdown for better aesthetics and integrated header look.
 */
export const DoctorSelector = () => {
    const { t } = useLanguage();
    const { viewDoctorId, setViewDoctorId, doctors, isStaff, doctorDisplayName } = useDoctors();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!isStaff) {
        return doctorDisplayName ? (
            <div className={styles.DoctorSelector__readonly}>
                <Icon name="medical_services" size="1rem" />
                <span>{doctorDisplayName}</span>
            </div>
        ) : null;
    }

    const currentDoctor = doctors.find(d => String(d.id) === String(viewDoctorId));

    return (
        <div className={styles.DoctorSelector__wrapper} ref={dropdownRef}>
            <div 
                className={`${styles.DoctorSelector__trigger} ${isOpen ? styles.DoctorSelector__triggerOpen : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
            >
                <div className={styles.DoctorSelector__iconContainer}>
                    <Icon name="medical_services" size="1rem" color="var(--primary-color)" />
                </div>
                <div className={styles.DoctorSelector__labelGroup}>
                    <span className={styles.DoctorSelector__label}>{t('doctor') || 'Médico'}</span>
                    <span className={styles.DoctorSelector__value}>
                        {currentDoctor ? currentDoctor.full_name : (t('all_doctors') || 'Todos los médicos')}
                    </span>
                </div>
                <Icon name={isOpen ? 'expand_less' : 'expand_more'} size="1.2rem" className={styles.DoctorSelector__chevron} />
            </div>

            {isOpen && (
                <div className={styles.DoctorSelector__dropdown}>
                    <div 
                        className={`${styles.DoctorSelector__option} ${!viewDoctorId ? styles.DoctorSelector__optionActive : ''}`}
                        onClick={() => { setViewDoctorId(''); setIsOpen(false); }}
                    >
                        <span className={styles.DoctorSelector__optionAvatar}>*</span>
                        {t('all_doctors') || 'Todos los médicos'}
                    </div>
                    {doctors.map(d => (
                        <div 
                            key={d.id}
                            className={`${styles.DoctorSelector__option} ${String(d.id) === String(viewDoctorId) ? styles.DoctorSelector__optionActive : ''}`}
                            onClick={() => { setViewDoctorId(String(d.id)); setIsOpen(false); }}
                        >
                            <span className={styles.DoctorSelector__optionAvatar}>{d.full_name.charAt(0)}</span>
                            {d.full_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


