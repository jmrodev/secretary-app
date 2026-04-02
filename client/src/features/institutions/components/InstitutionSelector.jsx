import React from 'react';
import Icon from '../../../components/atoms/Icon';

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
        <div className="inst-finances__selector-bar flex flex-wrap items-center justify-between gap-6 p-6 bg-white border border-gray-100 rounded-sm shadow-sm animate-fadeIn">
            <div className="flex items-center gap-4">
                <label className="inst-finances__label text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Icon name="business" size="1.2rem" color="var(--accent-color)" />
                    {t('institutions') || 'Instituciones'}:
                </label>
                <select
                    className="inst-finances__select min-w-[240px] py-2 px-4 rounded-sm border-gray-200 focus:border-accent text-sm font-bold text-gray-700 bg-gray-50"
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
                <div className="inst-finances__view-toggle flex bg-gray-50 p-1 rounded-sm border border-gray-100">
                    <button
                        className={`inst-finances__toggle-btn flex items-center gap-2 px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                            viewMode === 'transactions' 
                            ? 'bg-accent text-white shadow-md' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        onClick={() => setViewMode('transactions')}
                    >
                        <Icon name="analytics" size="1.1rem" />
                        {t('finances')}
                    </button>
                    <button
                        className={`inst-finances__toggle-btn flex items-center gap-2 px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
                            viewMode === 'patients' 
                            ? 'bg-accent text-white shadow-md' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
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
