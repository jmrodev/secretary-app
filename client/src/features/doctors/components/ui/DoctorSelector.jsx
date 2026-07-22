import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useDoctors } from '@/context/DoctorContextDefinition';
import styles from './DoctorSelector.module.css';

/**
 * ECC-Pattern: Optimized DoctorSelector.
 * Custom dropdown for better aesthetics and integrated header look.
 */
const DoctorSelector = () => {
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
            <div className={styles.readonly}>
                <Icon name="medical_services" size="1rem" />
                <span>{doctorDisplayName}</span>
            </div>
        ) : null;
    }

    const currentDoctor = doctors.find(d => String(d.id) === String(viewDoctorId));

    return (
        <div className={styles.wrapper} ref={dropdownRef}>
            <div 
                className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
            >
                <div className={styles.iconContainer}>
                    <Icon name="medical_services" size="1rem" color="var(--primary-color)" />
                </div>
                <div className={styles.labelGroup}>
                    <span className={styles.label}>{t('doctor') || 'Médico'}</span>
                    <span className={styles.value}>
                        {currentDoctor ? currentDoctor.full_name : (t('all_doctors') || 'Todos los médicos')}
                    </span>
                </div>
                <Icon name={isOpen ? 'expand_less' : 'expand_more'} size="1.2rem" className={styles.chevron} />
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div 
                        className={`${styles.option} ${!viewDoctorId ? styles.optionActive : ''}`}
                        onClick={() => { setViewDoctorId(''); setIsOpen(false); }}
                    >
                        <span className={styles.optionAvatar}>*</span>
                        {t('all_doctors') || 'Todos los médicos'}
                    </div>
                    {doctors.map(d => (
                        <div 
                            key={d.id}
                            className={`${styles.option} ${String(d.id) === String(viewDoctorId) ? styles.optionActive : ''}`}
                            onClick={() => { setViewDoctorId(String(d.id)); setIsOpen(false); }}
                        >
                            <span className={styles.optionAvatar}>{d.full_name.charAt(0)}</span>
                            {d.full_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorSelector;
