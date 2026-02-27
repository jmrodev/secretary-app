import React from 'react';
import Icon from '../atoms/Icon';

/**
 * InstitutionSelector Molecule.
 * Handles institution selection and view mode toggling.
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
        <div className="inst-finances__selector-bar">
            <div className="flex items-center gap-4">
                <label className="inst-finances__label">{t('institutions')}:</label>
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
                    <button
                        className={`inst-finances__toggle-btn ${viewMode === 'transactions' ? 'inst-finances__toggle-btn--active' : ''}`}
                        onClick={() => setViewMode('transactions')}
                    >
                        <Icon name="analytics" size="1.1rem" />
                        {t('finances')}
                    </button>
                    <button
                        className={`inst-finances__toggle-btn ${viewMode === 'patients' ? 'inst-finances__toggle-btn--active' : ''}`}
                        onClick={() => setViewMode('patients')}
                    >
                        <Icon name="groups" size="1.1rem" />
                        {t('patients')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default InstitutionSelector;
