import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDayScheduleHandlers } from '@/features/appointments/hooks/useDayScheduleHandlers';
import { isSameDay, compareDates, parseDate, createDate, toInputDate, formatTime } from '@/utils/core/dateUtils';
import { useFetch } from '@/hooks/useFetch';
import { formatCurrency } from '@/utils/core/format';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

import DayScheduleHeader from './DayScheduleHeader.jsx';
import ScheduleTimeline from './ScheduleTimeline.jsx';

import './DaySchedule.css';

const EMPTY_ARRAY = [];

/**
 * DaySchedule (Executor Component).
 * Orchestrates the display of daily appointments, time slots, and schedule navigation.
 * Now features a native toggle between timeline slots and interactive operative table.
 */
const DaySchedule = ({
    date, appointments, onSlotClick, doctor, schedule, onDateSelect,
    holidays = EMPTY_ARRAY, showOutOfHours, setShowOutOfHours, onNextFreeSlot,
    isLoading = false
}) => {
    const { t } = useLanguage();
    const [showCancelled, setShowCancelled] = React.useState(false);
    const [viewMode, setViewMode] = React.useState('timeline'); // 'timeline' | 'table'

    const { handlePrint, handlePrevDay, handleNextDay, handleToday, handleSlotAction } = useDayScheduleHandlers({
        date, appointments, doctor, onDateSelect, onSlotClick, showCancelled
    });

    const overturnStart = doctor?.overturn_start_time || '08:00';
    const overturnEnd = doctor?.overturn_end_time || '21:00';

    const dateStr = toInputDate(date);

    const dayApps = React.useMemo(() => {
        return [...appointments]
            .filter(appt => isSameDay(appt.appointment_date, date))
            .sort((a, b) => compareDates(a.appointment_date, b.appointment_date));
    }, [appointments, date]);

    const parseTime = (timeStr, baseDate) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        return createDate(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m);
    };

    let startLimit = createDate(date.getFullYear(), date.getMonth(), date.getDate(), 8);
    let endLimit = createDate(date.getFullYear(), date.getMonth(), date.getDate(), 21);

    if (showOutOfHours) {
        const oStart = parseTime(overturnStart, date);
        const oEnd = parseTime(overturnEnd, date);
        if (oStart < startLimit) startLimit = oStart;
        if (oEnd > endLimit) endLimit = oEnd;
        const sevenAM = createDate(date.getFullYear(), date.getMonth(), date.getDate(), 7);
        if (startLimit > sevenAM) startLimit = sevenAM;
    }

    if (schedule) {
        schedule.forEach(s => {
            const bStart = parseTime(s.start_time, date); const bEnd = parseTime(s.end_time, date);
            if (bStart < startLimit) startLimit = bStart; if (bEnd > endLimit) endLimit = bEnd;
        });
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;
    if (dayApps.length > 0) {
        dayApps.forEach(a => {
            const aStart = parseDate(a.appointment_date); const aEnd = parseDate(aStart.getTime() + duration * 60000);
            if (aStart < startLimit) startLimit = aStart; if (aEnd > endLimit) endLimit = aEnd;
        });
    }

    // Fetch SQL-First daily schedule
    const { data: rawSlots = EMPTY_ARRAY, loading, refetch } = useFetch('/appointments/daily-schedule', {
        params: { doctorId: doctor?.id, date: dateStr },
        initialData: EMPTY_ARRAY
    });

    // Sync with parent appointments (refetch if global list changes)
    React.useEffect(() => {
        refetch();
    }, [appointments, refetch]);

    const isAppLoading = isLoading || loading;

    // Group the SQL rows into timeSlots
    const timeSlots = React.useMemo(() => {
        if (!rawSlots || rawSlots.length === 0) return [];
        
        const slotsMap = new Map();
        
        rawSlots.forEach(row => {
            const timeStr = row.slot_time;
            if (!timeStr) return;
            if (!slotsMap.has(timeStr)) {
                // Parse time to Date object for the UI
                const [h, m] = timeStr.split(':').map(Number);

                const slotDate = createDate(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
                
                slotsMap.set(timeStr, {
                    time: slotDate,
                    type: row.slot_status === 'closed_holiday' ? 'closed' : 
                          row.slot_status === 'break' ? 'closed' : 
                          row.slot_status === 'out_of_hours' ? 'closed' : 'regular',
                    duration: (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60,
                    slotApps: [],
                    isBlockedByGoogle: row.slot_status === 'blocked'
                });
            }
            
            // If there's an appointment in this row, add it
            if (row.id) {
                slotsMap.get(timeStr).slotApps.push(row);
            }
        });
        
        return Array.from(slotsMap.values()).sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [rawSlots, date, doctor]);

    // Flatten appointments for the daily table view
    const dayAppointmentsFlat = React.useMemo(() => {
        return timeSlots.reduce((acc, slot) => {
            slot.slotApps.forEach(appt => {
                if (showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status)) {
                    acc.push({ ...appt, time: slot.time });
                }
            });
            return acc;
        }, []).sort((a, b) => a.time.getTime() - b.time.getTime());
    }, [timeSlots, showCancelled]);

    // Provide the pre-grouped appointments to ScheduleTimeline
    const getAppointmentsForSlot = (slotTime) => {
        const timeStr = slotTime.toTimeString().split(' ')[0]; // "08:00:00"
        const found = timeSlots.find(slot => slot.time.toTimeString().split(' ')[0] === timeStr);
        return found ? found.slotApps : [];
    };

    return (
        <div className="day-schedule">
            <DayScheduleHeader
                date={date} holiday={null} showOutOfHours={showOutOfHours} setShowOutOfHours={setShowOutOfHours}
                showCancelled={showCancelled} setShowCancelled={setShowCancelled}
                onPrevDay={handlePrevDay} onToday={handleToday} onNextDay={handleNextDay} onPrint={handlePrint}
                onNextFreeSlot={onNextFreeSlot}
                viewMode={viewMode} setViewMode={setViewMode}
                t={t}
            />

            {viewMode === 'table' ? (
                dayAppointmentsFlat.length === 0 ? (
                    <div className="upcoming-appointments-view__empty day-schedule__table-empty">
                        <Icon name="event_busy" size="3rem" className="upcoming-appointments-view__empty-icon" />
                        <h3 className="upcoming-appointments-view__empty-title">{t('no_appointments_today')}</h3>
                        <p className="upcoming-appointments-view__empty-hint">{t('no_appointments_today_hint')}</p>
                    </div>
                ) : (
                    <div className="upcoming-appointments-view__table-container animate-fade-in day-schedule__table-container">
                        <table className="upcoming-appointments-view__table">
                            <thead>
                                <tr>
                                    <th>{t('time')}</th>
                                    <th>{t('patient')}</th>
                                    <th>{t('service')}</th>
                                    <th>{t('payment')}</th>
                                    <th>{t('status')}</th>
                                    <th className="upcoming-appointments-view__actions-col">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dayAppointmentsFlat.map((appt) => {
                                    const timeStr = formatTime(appt.appointment_date, { hour12: false });
                                    const isVirtual = appt.type === 'virtual';
                                    
                                    // Cost Calculation
                                    const paid = Number(appt.paid_amount || 0);
                                    const pending = Number(appt.pending_amount || 0);
                                    const txTotal = paid + pending;
                                    const cost = Number(appt.cost || 0);
                                    const instBasePrice = Number(appt.institution_base_price || 0);
                                    const hasTransactions = txTotal > 0;
                                    const fallbackCost = cost > 0 ? cost : instBasePrice;
                                    const effectiveTotal = hasTransactions ? txTotal : fallbackCost;

                                    let paymentText;
                                    let paymentStatusClass;

                                    if (appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true') {
                                        paymentText = t('bonified') || 'Bonificado';
                                        paymentStatusClass = 'bonified';
                                    } else if (effectiveTotal === 0) {
                                        paymentText = t('free') || 'Sin Cargo';
                                        paymentStatusClass = 'free';
                                    } else if (paid >= effectiveTotal) {
                                        paymentText = formatCurrency(paid);
                                        paymentStatusClass = 'paid';
                                    } else {
                                        paymentText = formatCurrency(effectiveTotal);
                                        paymentStatusClass = pending > 0 ? 'debt' : 'pending';
                                    }

                                    return (
                                        <tr key={appt.id} className={`upcoming-appointments-view__row upcoming-appointments-view__row--${appt.status}`}>
                                            {/* Time */}
                                            <td className="upcoming-appointments-view__cell-date">
                                                <div className="upcoming-appointments-view__date-info">
                                                    <span className="upcoming-appointments-view__time-label">
                                                        <Icon name="schedule" size="0.95rem" />
                                                        {timeStr}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Patient */}
                                            <td>
                                                <div className="upcoming-appointments-view__patient-info">
                                                    <span className="upcoming-appointments-view__patient-name">{appt.patient_name || 'S/N'}</span>
                                                    <span className="upcoming-appointments-view__patient-subtext">
                                                        {appt.patient_dni && <span>DNI {appt.patient_dni}</span>}
                                                        {appt.patient_phone && <span className="upcoming-appointments-view__patient-phone">• {appt.patient_phone}</span>}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Service / Reason */}
                                            <td>
                                                <div className="upcoming-appointments-view__service-info">
                                                    <span className="upcoming-appointments-view__service-type">
                                                        {isVirtual ? (
                                                            <span className="upcoming-appointments-view__type-badge upcoming-appointments-view__type-badge--virtual">
                                                                <Icon name="videocam" size="0.9rem" />
                                                                {t('virtual') || 'Virtual'}
                                                            </span>
                                                        ) : (
                                                            <span className="upcoming-appointments-view__type-badge upcoming-appointments-view__type-badge--presential">
                                                                <Icon name="person" size="0.9rem" />
                                                                {t('presential') || 'Presencial'}
                                                            </span>
                                                        )}
                                                    </span>
                                                    {appt.reason && <span className="upcoming-appointments-view__reason">{appt.reason}</span>}
                                                </div>
                                            </td>

                                            {/* Pricing & Billing */}
                                            <td>
                                                <div className="upcoming-appointments-view__payment-info">
                                                    <span className={`upcoming-appointments-view__payment-badge upcoming-appointments-view__payment-badge--${paymentStatusClass}`}>
                                                        {paymentStatusClass === 'paid' && <Icon name="check_circle" size="0.9rem" />}
                                                        {paymentStatusClass === 'debt' && <Icon name="error" size="0.9rem" />}
                                                        {paymentText}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td>
                                                <span className={`upcoming-appointments-view__status-badge upcoming-appointments-view__status-badge--${appt.status}`}>
                                                    {t(appt.status) || appt.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="upcoming-appointments-view__cell-actions">
                                                <div className="upcoming-appointments-view__actions-wrapper">
                                                    <Button
                                                        variant="ghost" size="sm-compact"
                                                        onClick={() => onSlotClick(appt.time.getHours(), appt)}
                                                        title={t('view_details') || 'Gestionar Turno'}
                                                        icon={<Icon name="edit" size="1.05rem" />}
                                                        className="upcoming-appointments-view__action-btn"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <ScheduleTimeline
                    timeSlots={timeSlots} showOutOfHours={showOutOfHours} showCancelled={showCancelled}
                    onSlotClick={onSlotClick} onSlotAction={handleSlotAction} getAppointmentsForSlot={getAppointmentsForSlot} t={t}
                    isLoading={isAppLoading}
                />
            )}
        </div>
    );
};

export default DaySchedule;
