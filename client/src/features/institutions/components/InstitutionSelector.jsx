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
        <div className="inst-finances__selector-bar animate-fade-in">
            <div className="inst-finances__selector-group">
                <label className="inst-finances__label">
                    <Icon name="business" size="1.2rem" color="var(--accent-color)" />
                    {t('institutions') || 'Instituciones'}:
                </label>
                <select
                    className="inst-finances__select"
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
                <div className="inst-finances__view-toggle">
                    <Button
                        className={`inst-finances__toggle-btn ${
                            viewMode === 'transactions' 
                            ? 'inst-finances__toggle-btn--active' 
                            : ''
                        }`}
                        onClick={() => setViewMode('transactions')}
                        unstyled
                    >
                        <Icon name="analytics" size="1.1rem" />
                        {t('finances')}
                    </Button>
                    <Button
                        className={`inst-finances__toggle-btn ${
                            viewMode === 'patients' 
                            ? 'inst-finances__toggle-btn--active' 
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
