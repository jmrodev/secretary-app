import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

export const PatientPrintableFilters = ({
    printOptions,
    fromDate,
    toDate,
    limitCount,
    dispatch,
    onClose,
    t
}) => {
    return (
        <header className="printable-patient-sheet__header no-print">
            <Button variant="secondary" size="sm-compact" onClick={onClose}>
                &larr; {t('back')}
            </Button>

            <div className="printable-filters-container">
                <div className="printable-filters">
                    <span className="printable-filters__title">{t('sections')}</span>
                    <label className="printable-checkbox">
                        <input type="checkbox" checked={printOptions.datos} onChange={() => dispatch({ type: 'TOGGLE_OPTION', payload: 'datos' })} /> {t('personal_data')}
                    </label>
                    <label className="printable-checkbox">
                        <input type="checkbox" checked={printOptions.finanzas} onChange={() => dispatch({ type: 'TOGGLE_OPTION', payload: 'finanzas' })} /> {t('financial_history')}
                    </label>
                    <label className="printable-checkbox">
                        <input type="checkbox" checked={printOptions.turnos} onChange={() => dispatch({ type: 'TOGGLE_OPTION', payload: 'turnos' })} /> {t('appointments')}
                    </label>
                    <label className="printable-checkbox">
                        <input type="checkbox" checked={printOptions.cronicos} onChange={() => dispatch({ type: 'TOGGLE_OPTION', payload: 'cronicos' })} /> {t('chronic_medications')}
                    </label>
                    <label className="printable-checkbox">
                        <input type="checkbox" checked={printOptions.recetas} onChange={() => dispatch({ type: 'TOGGLE_OPTION', payload: 'recetas' })} /> {t('prescriptions')}
                    </label>
                </div>

                <div className="printable-filters">
                    <span className="printable-filters__title">{t('range_limit')}</span>
                    <input 
                        type="date" 
                        value={fromDate} 
                        onChange={(e) => dispatch({ type: 'SET_FILTER', payload: { name: 'fromDate', value: e.target.value } })} 
                        className="printable-input" 
                    />
                    <span>-</span>
                    <input 
                        type="date" 
                        value={toDate} 
                        onChange={(e) => dispatch({ type: 'SET_FILTER', payload: { name: 'toDate', value: e.target.value } })} 
                        className="printable-input" 
                    />
                    
                    <span className="ml-4">{t('limit')}</span>
                    <input 
                        type="number" 
                        placeholder={t('all')}
                        value={limitCount} 
                        onChange={(e) => dispatch({ type: 'SET_FILTER', payload: { name: 'limitCount', value: e.target.value } })} 
                        className="printable-input printable-input--w-60"
                    />
                </div>
            </div>

            <Button variant="primary" size="sm-compact" onClick={() => window.print()} icon={<Icon name="print" size="1.2rem" />}>
                {t('print')}
            </Button>
        </header>
    );
};
