
import React, { useState } from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './PatientPrintableView.css';

/**
 * PatientPrintableView Organism (Executor).
 * Renders a clean printable view of patient records.
 * Provides filters for specific sections and date ranges.
 */
const PatientPrintableView = ({ 
    details, 
    chronicMeds, 
    recentRequests, 
    onClose, 
    t 
}) => {
    // Advanced Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [limitCount, setLimitCount] = useState('');
    const [excludedItems, setExcludedItems] = useState(new Set()); 

    const [printOptions, setPrintOptions] = useState({
        datos: true,
        finanzas: true,
        turnos: true,
        cronicos: true,
        recetas: true
    });

    const toggleExclude = (idKey) => {
        setExcludedItems(prev => {
            const up = new Set(prev);
            if (up.has(idKey)) up.delete(idKey);
            else up.add(idKey);
            return up;
        });
    };

    const filterByDateAndLimit = (items, dateProp) => {
        if (!items) return [];
        let filtered = [...items];

        if (fromDate) {
            filtered = filtered.filter(i => new Date(i[dateProp]).setHours(0,0,0,0) >= new Date(fromDate).setHours(0,0,0,0));
        }
        if (toDate) {
            filtered = filtered.filter(i => new Date(i[dateProp]).setHours(23,59,59,999) <= new Date(toDate).setHours(23,59,59,999));
        }

        filtered.sort((a,b) => new Date(b[dateProp]) - new Date(a[dateProp]));

        if (limitCount && Number(limitCount) > 0) {
            filtered = filtered.slice(0, Number(limitCount));
        }

        return filtered;
    };

    const formatMedicationData = (dataStr) => {
        if (!dataStr) return '-';
        // Iteratively strip tags until none remain, preventing multi-char bypass attacks
        let cleanStr = String(dataStr);
        let prev;
        do {
            prev = cleanStr;
            cleanStr = cleanStr.replace(/<[^>]*>/g, '');
        } while (cleanStr !== prev);
        cleanStr = cleanStr.trim();
        if (cleanStr.startsWith('[') || cleanStr.startsWith('{')) {
            try {
                const parsed = JSON.parse(cleanStr);
                if (Array.isArray(parsed)) {
                    return (
                        <ul className="printable-sublist">
                            {parsed.map((m, i) => <li key={i}>{m.name}</li>)}
                        </ul>
                    );
                }
            } catch (e) { /* fallback */ }
        }
        
        const lines = cleanStr.split(/[\r\n]+/).filter(l => l.trim().length > 0);
        if (lines.length > 1) {
            return (
                <ul className="printable-sublist">
                    {lines.map((line, i) => <li key={i}>{line.trim()}</li>)}
                </ul>
            );
        }
        return <p className="printable-text text-preline">{cleanStr}</p>;
    };

    return (
        <div className="printable-patient-sheet printable-patient-sheet--fullscreen animate-fadeIn">
            <header className="printable-patient-sheet__header no-print">
                <Button variant="secondary" size="sm-compact" onClick={onClose}>
                    &larr; {t('back')}
                </Button>

                <div className="printable-filters-container">
                    <div className="printable-filters">
                        <span className="printable-filters__title">{t('sections')}</span>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.datos} onChange={() => setPrintOptions(p => ({ ...p, datos: !p.datos }))} /> {t('personal_data')}
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.finanzas} onChange={() => setPrintOptions(p => ({ ...p, finanzas: !p.finanzas }))} /> {t('financial_history')}
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.turnos} onChange={() => setPrintOptions(p => ({ ...p, turnos: !p.turnos }))} /> {t('appointments')}
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.cronicos} onChange={() => setPrintOptions(p => ({ ...p, cronicos: !p.cronicos }))} /> {t('chronic_medications')}
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.recetas} onChange={() => setPrintOptions(p => ({ ...p, recetas: !p.recetas }))} /> {t('prescriptions')}
                        </label>
                    </div>

                    <div className="printable-filters">
                        <span className="printable-filters__title">{t('range_limit')}</span>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="printable-input" />
                        <span>-</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="printable-input" />
                        
                        <span className="ml-4">{t('limit')}</span>
                        <input 
                            type="number" 
                            placeholder={t('all')}
                            value={limitCount} 
                            onChange={(e) => setLimitCount(e.target.value)} 
                            className="printable-input printable-input--w-60"
                        />
                    </div>
                </div>

                <Button variant="primary" size="sm-compact" onClick={() => window.print()} icon={<Icon name="print" size="1.2rem" />}>
                    {t('print')}
                </Button>
            </header>

            <h1 className="printable-title">{t('patient_sheet')}: {details.full_name.toUpperCase()}</h1>
            <hr className="printable-divider" />
            
            {printOptions.datos && (
                <>
                    <h3 className="printable-subtitle">{t('personal_data_title')}</h3>
                    <ul className="printable-list">
                        <li><strong>DNI:</strong> {details.dni || '-'}</li>
                        <li><strong>{t('phone')}:</strong> {details.phone || '-'}</li>
                        <li><strong>Email:</strong> {details.email || '-'}</li>
                        <li><strong>{t('location')}:</strong> {details.street_name || ''} {details.street_number || ''}, {details.city || ''}</li>
                        <li><strong>{t('insurance')}:</strong> {details.insurance_name || '-'}</li>
                    </ul>
                </>
            )}

            {printOptions.finanzas && (
                <>
                    <h3 className="printable-subtitle">{t('financial_status_title')}</h3>
                    <ul className="printable-list">
                        <li><strong>{t('current_debt')}:</strong> ${details.total_debt || '0'}</li>
                        {details.institution_name && (
                            <li><em>* {t('derived_institution')}: {details.institution_name}</em></li>
                        )}
                    </ul>
                </>
            )}

            {printOptions.turnos && (
                <>
                    <h3 className="printable-subtitle">{t('appointment_history')}</h3>
                    {details.appointments && details.appointments.length > 0 ? (
                        <ul className="printable-list">
                            {filterByDateAndLimit(details.appointments, 'appointment_date').map(app => {
                                const isExcluded = excludedItems.has(`appt_${app.id}`);
                                return (
                                    <li key={app.id} className={`${isExcluded ? 'no-print' : ''} printable-list-item--flex`}>
                                        <input 
                                            type="checkbox" 
                                            checked={!isExcluded} 
                                            onChange={() => toggleExclude(`appt_${app.id}`)} 
                                            className="no-print cursor-pointer"
                                        />
                                        <div>
                                            <strong>{new Date(app.appointment_date).toLocaleDateString('es-AR')} {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong> 
                                            {app.doctor_name ? ` | ${t('doctor')}: ${app.doctor_name}` : ''}
                                            | {t('status')}: {t(app.status)} 
                                            | {t('reason')}: {app.reason || '-'} 
                                            {app.cancellation_reason ? ` (${t('cancellation')}: ${app.cancellation_reason})` : ''}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="printable-text">{t('no_appointments_registered')}</p>
                    )}
                </>
            )}

            {printOptions.cronicos && (
                <>
                    <h3 className="printable-subtitle">{t('chronic_medication_title')}</h3>
                    {chronicMeds && chronicMeds.length > 0 ? (
                        <ul className="printable-list">
                            {chronicMeds.map((m, idx) => (
                                <li key={idx}>
                                    <strong>{m.medication_name}</strong> {m.dose ? `- ${t('dose')}: ${m.dose}` : ''} {m.frequency ? `(${m.frequency})` : ''} {m.notes ? `| ${t('obs')}: ${m.notes}` : ''}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="printable-text">{t('no_chronic_medication')}</p>
                    )}
                </>
            )}

            {printOptions.recetas && (
                <>
                    <h3 className="printable-subtitle">{t('prescription_history')}</h3>
                    {recentRequests && recentRequests.length > 0 ? (
                        <ul className="printable-list">
                            {filterByDateAndLimit(recentRequests, 'created_at').map((p, idx) => {
                                const isExcluded = excludedItems.has(`req_${p.id}`);
                                return (
                                    <li key={idx} className={`printable-list-item--grouped ${isExcluded ? 'no-print' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={!isExcluded} 
                                            onChange={() => toggleExclude(`req_${p.id}`)} 
                                            className="no-print cursor-pointer mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="printable-item-header mb-1 text-sm-compact">
                                                <strong>{new Date(p.created_at || p.action_date).toLocaleDateString('es-AR')}</strong> 
                                                {p.doctor_name ? ` | ${t('doctor')}: ${p.doctor_name}` : ''}
                                            </div>
                                            <div className="printable-item-content">
                                                {formatMedicationData(p.raw_medication_data || p.request_note)}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="printable-text">{t('no_prescription_history')}</p>
                    )}
                </>
            )}
        </div>
    );
};

export default React.memo(PatientPrintableView);
