import React, { useReducer, useMemo, useCallback } from 'react';
import { parseDate } from '@/utils/core/dateUtils';
import { PatientPrintableFilters } from '../sections/PatientPrintableFilters';
import { PatientPrintableContent } from '../sections/PatientPrintableContent';
import styles from './PatientPrintableView.module.css';

const initialState = {
    fromDate: '',
    toDate: '',
    limitCount: '',
    excludedItems: new Set(),
    printOptions: {
        datos: true,
        finanzas: true,
        turnos: true,
        cronicos: true,
        recetas: true
    }
};

function printReducer(state, action) {
    switch (action.type) {
        case 'SET_FILTER':
            return { ...state, [action.payload.name]: action.payload.value };
        case 'TOGGLE_OPTION':
            return {
                ...state,
                printOptions: {
                    ...state.printOptions,
                    [action.payload]: !state.printOptions[action.payload]
                }
            };
        case 'TOGGLE_EXCLUDE': {
            const up = new Set(state.excludedItems);
            if (up.has(action.payload)) up.delete(action.payload);
            else up.add(action.payload);
            return { ...state, excludedItems: up };
        }
        default:
            return state;
    }
}

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
    const [state, dispatch] = useReducer(printReducer, initialState);
    const { fromDate, toDate, limitCount, excludedItems, printOptions } = state;

    const toggleExclude = (idKey) => {
        dispatch({ type: 'TOGGLE_EXCLUDE', payload: idKey });
    };

    const filterByDateAndLimit = useCallback((items, dateProp) => {
        if (!items) return [];
        let filtered = [...items];

        if (fromDate) {
            const start = parseDate(fromDate);
            if (start) start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(i => {
                const d = parseDate(i[dateProp]);
                return d && d.setHours(0, 0, 0, 0) >= start?.getTime();
            });
        }
        if (toDate) {
            const end = parseDate(toDate);
            if (end) end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(i => {
                const d = parseDate(i[dateProp]);
                return d && d.setHours(23, 59, 59, 999) <= end?.getTime();
            });
        }

        filtered.sort((a, b) => (parseDate(b[dateProp]) || 0) - (parseDate(a[dateProp]) || 0));

        if (limitCount && Number(limitCount) > 0) {
            filtered = filtered.slice(0, Number(limitCount));
        }

        return filtered;
    }, [fromDate, toDate, limitCount]);

    const filteredAppointments = useMemo(() => 
        filterByDateAndLimit(details.appointments, 'appointment_date'),
        [details.appointments, filterByDateAndLimit]
    );

    const filteredRequests = useMemo(() => 
        filterByDateAndLimit(recentRequests, 'created_at'),
        [recentRequests, filterByDateAndLimit]
    );

    const formatMedicationData = (dataStr) => {
        if (!dataStr) return '-';
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
                        <ul className={`${styles.printableSublist}`}>
                            {parsed.map((m) => <li key={m.name}>{m.name}</li>)}
                        </ul>
                    );
                }
            } catch { /* fallback */ }
        }
        
        const lines = cleanStr.split(/[\r\n]+/).filter(l => l.trim().length > 0);
        if (lines.length > 1) {
            return (
                <ul className={`${styles.printableSublist}`}>
                    {lines.map((line) => <li key={line}>{line.trim()}</li>)}
                </ul>
            );
        }
        return <p className={`${styles.printableText} text-preline`}>{cleanStr}</p>;
    };

    return (
        <div className={`${styles.fullscreen} printable-patient-sheet animate-fade-in`}>
            <PatientPrintableFilters
                printOptions={printOptions}
                fromDate={fromDate}
                toDate={toDate}
                limitCount={limitCount}
                dispatch={dispatch}
                onClose={onClose}
                t={t}
            />

            <PatientPrintableContent
                details={details}
                printOptions={printOptions}
                filteredAppointments={filteredAppointments}
                chronicMeds={chronicMeds}
                filteredRequests={filteredRequests}
                excludedItems={excludedItems}
                toggleExclude={toggleExclude}
                formatMedicationData={formatMedicationData}
                t={t}
            />
        </div>
    );
};

export default React.memo(PatientPrintableView);
