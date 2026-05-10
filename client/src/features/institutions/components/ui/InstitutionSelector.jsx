import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './InstitutionSelector.css';

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
        <div className="institution-selector animate-fade-in">
            <div className="institution-selector__group">
                <label className="institution-selector__label">
                    <Icon name="business" size="1.2rem" color="var(--accent-color)" />
                    {t('institutions') || 'Instituciones'}:
                </label>
                <select
                    className="institution-selector__select"
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
                <div className="institution-selector__view-toggle">
                    <Button
                        className={`institution-selector__toggle-btn ${
                            viewMode === 'transactions' 
                            ? 'institution-selector__toggle-btn--active' 
                            : ''
                        }`}
                        onClick={() => setViewMode('transactions')}
                        unstyled
                    >
                        <Icon name="analytics" size="1.1rem" />
                        {t('finances')}
                    </Button>
                    <Button
                        className={`institution-selector__toggle-btn ${
                            viewMode === 'patients' 
                            ? 'institution-selector__toggle-btn--active' 
                            : ''
                        }`}
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
