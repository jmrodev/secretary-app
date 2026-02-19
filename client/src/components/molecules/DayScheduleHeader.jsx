import React from 'react';
import Button from '../atoms/Button';
import Switch from '../atoms/Switch';
import { formatDate } from '../../utils/dateUtils';

/**
 * DayScheduleHeader Molecule.
 * Manages calendar navigation (prev/next/today) and view controls (print/toggles).
 */
const DayScheduleHeader = ({
    date,
    holiday,
    showOutOfHours,
    setShowOutOfHours,
    showCancelled,
    setShowCancelled,
    onPrevDay,
    onToday,
    onNextDay,
    onPrint,
    t
}) => {
    return (
        <header className="day-schedule__header">
            <div className="day-schedule__title-group">
                <h3 className="day-schedule__title">
                    {formatDate(date, { weekday: true, monthName: true, hideYear: true })}
                </h3>
                <div className="day-schedule__holiday-container">
                    {holiday && (
                        <span className="day-schedule__holiday-badge">
                            🏖️ {holiday.description}
                        </span>
                    )}
                </div>
            </div>

            <div className="day-schedule__nav">
                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onPrevDay}
                    title={t('prev_day') || "Día Anterior"}
                >
                    ⬅️
                </Button>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onToday}
                    className="day-schedule__today-btn"
                    title={t('today') || "Hoy"}
                >
                    {t('today') || "Hoy"}
                </Button>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onNextDay}
                    title={t('next_day') || "Día Siguiente"}
                >
                    ➡️
                </Button>
            </div>

            <div className="day-schedule__toolbar">
                <div className="day-schedule__controls">
                    <Switch
                        label={t('show_out_of_hours') || 'Mostrar fuera de horario'}
                        checked={showOutOfHours}
                        onChange={setShowOutOfHours}
                    />
                    <Switch
                        label={t('show_cancelled') || 'Mostrar Cancelados'}
                        checked={showCancelled}
                        onChange={setShowCancelled}
                    />
                </div>

                <Button
                    variant="ghost"
                    size="sm-compact"
                    onClick={onPrint}
                    className="day-schedule__print-btn"
                    title={t('print_list_tooltip') || "Imprimir lista del día"}
                    icon="🖨️"
                >
                    {t('print') || 'Imprimir'}
                </Button>
            </div>
        </header>
    );
};

export default DayScheduleHeader;
