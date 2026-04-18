import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
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
        <div className="inst-finances__selector-bar animate-fadeIn">
            <div className="inst-finances__selector-group">
                <label className="inst-finances__label">
                    <Icon name="business" size="1.2rem" color="var(--accent-color)" />
                    {(t('institutions') || 'Instituciones') + ':'}
                </label>
                <Select
                    className="inst-finances__select"
                    value={selectedInstId}
                    onChange={e => setSelectedInstId(e.target.value)}
                    options={[
                        { value: '', label: t('select_institution') },
                        ...institutions.map(i => ({ value: i.id, label: i.name }))
                    ]}
                />
            </div>

            {selectedInstId && (
                <div className="inst-finances__view-toggle">
                    <Button
<<<<<<< HEAD
                        variant={viewMode === 'transactions' ? 'primary' : 'ghost'}
=======
>>>>>>> main
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
<<<<<<< HEAD
                        variant={viewMode === 'patients' ? 'primary' : 'ghost'}
=======
>>>>>>> main
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
