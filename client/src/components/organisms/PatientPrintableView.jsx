import React, { useState } from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './PatientPrintableView.css';

/**
 * Organism that renders a clean printable view of patient records.
 * Follows Atomic design principles.
 */
const PatientPrintableView = ({ 
    details, 
    chronicMeds, 
    recentRequests, 
    onClose, 
    t 
}) => {
    // Filtros Avanzados
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
        const cleanStr = dataStr.replace(/<[^>]*>/g, '').trim();
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
        return <p className="printable-text" style={{ whiteSpace: 'pre-line' }}>{cleanStr}</p>;
    };

    return (
        <div className="printable-patient-sheet printable-patient-sheet--fullscreen animate-fadeIn">
            <header className="printable-patient-sheet__header no-print">
                <Button variant="secondary" size="sm-compact" onClick={onClose}>
                    &larr; {t('back') || 'Volver'}
                </Button>

                <div className="printable-filters-container">
                    <div className="printable-filters">
                        <span className="printable-filters__title">Secciones:</span>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.datos} onChange={() => setPrintOptions(p => ({ ...p, datos: !p.datos }))} /> Datos
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.finanzas} onChange={() => setPrintOptions(p => ({ ...p, finanzas: !p.finanzas }))} /> Balances
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.turnos} onChange={() => setPrintOptions(p => ({ ...p, turnos: !p.turnos }))} /> Turnos
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.cronicos} onChange={() => setPrintOptions(p => ({ ...p, cronicos: !p.cronicos }))} /> Cránicos
                        </label>
                        <label className="printable-checkbox">
                            <input type="checkbox" checked={printOptions.recetas} onChange={() => setPrintOptions(p => ({ ...p, recetas: !p.recetas }))} /> Recetas
                        </label>
                    </div>

                    <div className="printable-filters">
                        <span className="printable-filters__title">Rango / Cant:</span>
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="printable-input" />
                        <span>-</span>
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="printable-input" />
                        
                        <span style={{ marginLeft: '1rem' }}>Últimos:</span>
                        <input 
                            type="number" 
                            placeholder="Todos" 
                            value={limitCount} 
                            onChange={(e) => setLimitCount(e.target.value)} 
                            className="printable-input"
                            style={{ width: '60px' }} 
                        />
                    </div>
                </div>

                <Button variant="primary" size="sm-compact" onClick={() => window.print()} icon={<Icon name="print" size="1.2rem" />}>
                    {t('print') || 'Imprimir'}
                </Button>
            </header>

            <h1 className="printable-title">FICHA DEL PACIENTE: {details.full_name.toUpperCase()}</h1>
            <hr className="printable-divider" />
            
            {printOptions.datos && (
                <>
                    <h3 className="printable-subtitle">DATOS PERSONALES</h3>
                    <ul className="printable-list">
                        <li><strong>DNI:</strong> {details.dni || '-'}</li>
                        <li><strong>Teléfono:</strong> {details.phone || '-'}</li>
                        <li><strong>Email:</strong> {details.email || '-'}</li>
                        <li><strong>Ubicación:</strong> {details.street_name || ''} {details.street_number || ''}, {details.city || ''}</li>
                        <li><strong>OS / Prepaga:</strong> {details.insurance_name || '-'}</li>
                    </ul>
                </>
            )}

            {printOptions.finanzas && (
                <>
                    <h3 className="printable-subtitle">ESTADO FINANCIERO</h3>
                    <ul className="printable-list">
                        <li><strong>Deuda Actual:</strong> ${details.total_debt || '0'}</li>
                        {details.institution_name && (
                            <li><em>* Derivado de Institución: {details.institution_name}</em></li>
                        )}
                    </ul>
                </>
            )}

            {printOptions.turnos && (
                <>
                    <h3 className="printable-subtitle">HISTORIAL DE TURNOS</h3>
                    {details.appointments && details.appointments.length > 0 ? (
                        <ul className="printable-list">
                            {filterByDateAndLimit(details.appointments, 'appointment_date').map(app => {
                                const isExcluded = excludedItems.has(`appt_${app.id}`);
                                return (
                                    <li key={app.id} className={isExcluded ? 'no-print' : ''} style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={!isExcluded} 
                                            onChange={() => toggleExclude(`appt_${app.id}`)} 
                                            className="no-print"
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <div>
                                            <strong>{new Date(app.appointment_date).toLocaleDateString('es-AR')} {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</strong> 
                                            | Dr/a: {app.doctor_name || '-'} 
                                            | Estado: {t(app.status) || app.status} 
                                            | Motivo: {app.reason || '-'} 
                                            {app.cancellation_reason ? ` (Cancelación: ${app.cancellation_reason})` : ''}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="printable-text">No hay turnos registrados.</p>
                    )}
                </>
            )}

            {printOptions.cronicos && (
                <>
                    <h3 className="printable-subtitle">MEDICACIÓN CRÓNICA / HABITUAL</h3>
                    {chronicMeds && chronicMeds.length > 0 ? (
                        <ul className="printable-list">
                            {chronicMeds.map((m, idx) => (
                                <li key={idx}>
                                    <strong>{m.medication_name}</strong> {m.dose ? `- Dosis: ${m.dose}` : ''} {m.frequency ? `(${m.frequency})` : ''} {m.notes ? `| Obs: ${m.notes}` : ''}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="printable-text">No hay registros de medicación crónica.</p>
                    )}
                </>
            )}

            {printOptions.recetas && (
                <>
                    <h3 className="printable-subtitle">HISTORIAL DE RECETAS EMITIDAS</h3>
                    {recentRequests && recentRequests.length > 0 ? (
                        <ul className="printable-list">
                            {filterByDateAndLimit(recentRequests, 'created_at').map((p, idx) => {
                                const isExcluded = excludedItems.has(`req_${p.id}`);
                                return (
                                    <li key={idx} className={`printable-list-item--grouped ${isExcluded ? 'no-print' : ''}`} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={!isExcluded} 
                                            onChange={() => toggleExclude(`req_${p.id}`)} 
                                            className="no-print"
                                            style={{ cursor: 'pointer', marginTop: '4px' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div className="printable-item-header" style={{ marginBottom: '0.3rem' }}>
                                                <strong>{new Date(p.created_at || p.action_date).toLocaleDateString('es-AR')}</strong> 
                                                {p.doctor_name ? ` | Dr/a: ${p.doctor_name}` : ''}
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
                        <p className="printable-text">No hay historial de recetas emitidas.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default PatientPrintableView;
