import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './InstitutionSelector.module.css';

/**
 * InstitutionSelector Feature Molecule.
 * UI component for switching between institutions and view modes (Finances/Patients).
 * Core navigation element within the institutions domain.
 */
const InstitutionSelector = ({
    institutions,
    selectedInstId,
    setSelectedInstId,
    viewMode,
    setViewMode,
    t
}) => {
    return (
        <div className={`${styles.root} animate-fade-in`}>
            <div className={`${styles.group}`}>
                <label className={`${styles.label}`}>
                    <Icon name="business" size="1.2rem" color="var(--accent-color)" />
                    {t('institutions') || 'Instituciones'}:
                </label>
                <select
                    className={`${styles.select}`}
                    value={selectedInstId}
                    onChange={e => setSelectedInstId(e.target.value)}
                >
                    <option value="">{t('select_institution')}</option>
                    {institutions.map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                </select>
            </div>

            {selectedInstId && (
                <div className={`${styles.viewToggle}`}>
                    <Button
                        className={`${styles.toggleBtn} ${ viewMode === 'transactions' ? styles.toggleBtnActive : '' }`}
                        onClick={() => setViewMode('transactions')}
                        unstyled
                    >
                        <Icon name="analytics" size="1.1rem" />
                        {t('finances')}
                    </Button>
                    <Button
                        className={`${styles.toggleBtn} ${ viewMode === 'patients' ? styles.toggleBtnActive : '' }`}
                        onClick={() => setViewMode('patients')}
                        unstyled
                    >
                        <Icon name="groups" size="1.1rem" />
                        {t('patients')}
                    </Button>
                </div>
            )}
        </div>
    );
};


export default InstitutionSelector;
