import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { useConfig } from '../../context/ConfigContext';
import AppointmentCard from '../molecules/AppointmentCard';
import Button from '../atoms/Button';
import Switch from '../atoms/Switch';
import './DaySchedule.css';

const DaySchedule = ({ date, appointments, onSlotClick, doctor, schedule, onDateSelect }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();
    const { settings } = useConfig();
    const [showOutOfHours, setShowOutOfHours] = React.useState(false);
    const [showCancelled, setShowCancelled] = React.useState(false);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Por favor permita ventanas emergentes para imprimir.");

        const dayName = date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const doctorName = doctor ? (doctor.full_name || doctor.username) : '';

        const appsToPrint = appointments
            .filter(appt => {
                const d = new Date(appt.appointment_date);
                return d.getFullYear() === date.getFullYear() &&
                    d.getMonth() === date.getMonth() &&
                    d.getDate() === date.getDate();
            })
            .filter(appt => showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status))
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        const statusMap = {
            'confirmed': 'Confirmado', 'pending': 'Pendiente', 'arrived': 'En Sala',
            'completed': 'Completado', 'attended': 'Atendido', 'cancelled': 'Cancelado',
            'absent': 'Ausente', 'suspended': 'Suspendido', 'virtual': 'Virtual', 'external': 'Externo'
        };

        const translateStatus = (status) => statusMap[status] || t(status) || status;

        let htmlContent = `
            <html>
            <head>
                <title>Pacientes - ${dayName}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #4f46e5; font-size: 24px; }
                    .header p { margin: 5px 0 0; color: #666; font-size: 16px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { text-align: left; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; font-weight: 600; color: #475569; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .time { font-weight: bold; color: #1e293b; width: 80px; }
                    .patient { font-weight: 600; color: #1e1e1e; }
                    .status { font-size: 12px; text-transform: uppercase; font-weight: bold; }
                    .cancelled { color: #ef4444; }
                    .confirmed { color: #10b981; }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 1.5cm; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Lista de Pacientes</h1>
                    <p>${dayName}</p>
                    ${doctorName ? `<p>Dr/a: ${doctorName}</p>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Paciente</th>
                            <th>Teléfono</th>
                            <th>Motivo</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appsToPrint.length > 0 ? appsToPrint.map(appt => `
                            <tr>
                                <td class="time">${new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                <td class="patient">${appt.patient_name || 'S/N'}</td>
                                <td>${appt.patient_phone || '-'}</td>
                                <td>${appt.reason || '-'}</td>
                                <td class="status ${appt.status}">${translateStatus(appt.status)}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align:center;">No hay turnos para este día</td></tr>'}
                    </tbody>
                </table>
                <div style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: right;">
                    Generado el ${new Date().toLocaleString()}
                </div>
                <script>
                    window.onload = function() { 
                        window.print(); 
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };
    const handlePrevDay = () => {
        const prev = new Date(date);
        prev.setDate(date.getDate() - 1);
        onDateSelect(prev);
    };

    const handleNextDay = () => {
        const next = new Date(date);
        next.setDate(date.getDate() + 1);
        onDateSelect(next);
    };

    const handleSlotAction = async (slot) => {
        if (slot.type === 'closed') {
            const confirmed = await confirm(t('confirm_out_of_hours') || "⚠️ Este horario está marcado como NO LABORABLE. ¿Desea asignar un turno de todas formas?");
            if (confirmed) {
                onSlotClick(slot.time.getHours(), null, slot.time.getMinutes());
            }
        } else {
            onSlotClick(slot.time.getHours(), null, slot.time.getMinutes());
        }
    };

    const overturnStart = doctor?.overturn_start_time || '08:00';
    const overturnEnd = doctor?.overturn_end_time || '21:00';

    let daysConfig = (schedule || []).filter(s => s.day_of_week === date.getDay() && s.is_break === 0);

    const dayApps = appointments.filter(appt => {
        const d = new Date(appt.appointment_date);
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
    });

    // Precise calculation of bounds
    const parseTime = (timeStr, baseDate) => {
        if (!timeStr) return null;
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(baseDate);
        d.setHours(h, m, 0, 0);
        return d;
    };

    let startLimit = new Date(date);
    startLimit.setHours(8, 0, 0, 0);

    let endLimit = new Date(date);
    endLimit.setHours(21, 0, 0, 0);

    // If showing out of hours, try to snap to the EXACT minute of the overturn start
    const oStart = parseTime(overturnStart, date);
    const oEnd = parseTime(overturnEnd, date);

    if (showOutOfHours) {
        startLimit = oStart;
        endLimit = oEnd;
    }

    // Expand if there are earlier/later blocks or appointments
    if (schedule && schedule.length > 0) {
        schedule.forEach(s => {
            const bStart = parseTime(s.start_time, date);
            const bEnd = parseTime(s.end_time, date);
            if (bStart < startLimit) startLimit = bStart;
            if (bEnd > endLimit) endLimit = bEnd;
        });
    }

    if (dayApps.length > 0) {
        dayApps.forEach(a => {
            const aStart = new Date(a.appointment_date);
            const aEnd = new Date(aStart.getTime() + duration * 60000);
            if (aStart < startLimit) startLimit = aStart;
            if (aEnd > endLimit) endLimit = aEnd;
        });
    }

    const duration = (doctor && doctor.appointment_duration) ? doctor.appointment_duration : 60;
    const timeSlots = [];
    let currentTime = new Date(startLimit);
    const endTime = new Date(endLimit);

    while (currentTime < endTime) {
        const timeStr = currentTime.toTimeString().split(' ')[0];
        let type = 'regular';

        let currentBlock = null;
        let nextBlock = null;

        if (daysConfig.length > 0) {
            currentBlock = daysConfig.find(block => {
                return timeStr >= block.start_time && timeStr < block.end_time;
            });

            // Find if a block starts after current time but before we'd finish a full duration
            nextBlock = daysConfig
                .filter(b => b.start_time > timeStr)
                .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

            if (!currentBlock) type = 'closed';
        } else {
            if (timeStr < overturnStart || timeStr >= overturnEnd) type = 'closed';
        }

        const slotStart = new Date(currentTime);
        let slotDuration = duration;

        // 1. If we are in a gap (closed) and a block starts soon, snap to it
        if (type === 'closed' && nextBlock) {
            const [nh, nm] = nextBlock.start_time.split(':');
            const nextStartTime = new Date(currentTime);
            nextStartTime.setHours(nh, nm, 0, 0);
            const diffMin = (nextStartTime.getTime() - currentTime.getTime()) / 60000;
            if (diffMin > 0 && diffMin < slotDuration) {
                slotDuration = diffMin;
            }
        }

        // 2. Determine if we should force alignment based on block setting or doctor setting
        const blockForce = currentBlock ? (currentBlock.force_hour_alignment === 1) : doctor?.force_hour_alignment;

        if (blockForce && slotStart.getMinutes() !== 0) {
            slotDuration = 60 - slotStart.getMinutes();
        }

        // 3. Ensure we don't overflow the current block's end
        if (currentBlock) {
            const [eh, em] = currentBlock.end_time.split(':');
            const blockEndTime = new Date(currentTime);
            blockEndTime.setHours(eh, em, 0, 0);
            const remainingMin = (blockEndTime.getTime() - currentTime.getTime()) / 60000;
            if (remainingMin > 0 && remainingMin < slotDuration) {
                slotDuration = remainingMin;
            }
        }

        // Avoid infinite loops/zero duration
        if (slotDuration <= 0) slotDuration = 15;

        timeSlots.push({
            time: slotStart,
            type: type,
            duration: slotDuration
        });

        currentTime = new Date(slotStart.getTime() + slotDuration * 60000);
    }

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getAppointmentsForSlot = (slotTime, durationMinutes) => {
        return appointments.filter(appt => {
            const apptDate = new Date(appt.appointment_date);
            if (!isSameDay(apptDate, date)) return false;

            const slotStart = slotTime.getTime();
            const slotEnd = slotStart + durationMinutes * 60000;
            const apptStart = apptDate.getTime();

            return apptStart >= slotStart && apptStart < slotEnd;
        });
    };

    return (
        <div className="day-schedule">
            <header className="day-schedule__header">
                <h3 className="day-schedule__title">
                    {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>

                <div className="day-schedule__nav">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={handlePrevDay}
                        title={t('prev_day') || "Día Anterior"}
                    >
                        ⬅️
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={handleNextDay}
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
                        onClick={handlePrint}
                        className="day-schedule__print-btn"
                        title={t('print_list_tooltip') || "Imprimir lista del día"}
                        icon="🖨️"
                    >
                        {t('print') || 'Imprimir'}
                    </Button>
                </div>
            </header>

            <div className="schedule-timeline">
                {timeSlots
                    .map(slot => ({
                        ...slot,
                        slotApps: getAppointmentsForSlot(slot.time, slot.duration)
                    }))
                    .filter(slot => {
                        if (showOutOfHours) return true;
                        if (slot.type !== 'closed') return true;
                        return slot.slotApps.length > 0;
                    })
                    .map((slot, index) => {
                        const { slotApps, type } = slot;
                        const isSlotClosed = type === 'closed';
                        const isSlotBreak = type === 'break';
                        const isBlocked = slotApps.some(a => !['cancelled', 'suspended', 'absent'].includes(a.status));

                        const slotClasses = `time-slot ${isSlotClosed ? 'time-slot--closed' : ''} ${isSlotBreak ? 'time-slot--break' : ''}`;

                        return (
                            <div key={index} className={slotClasses}>
                                <div className="slot-content">
                                    {slotApps
                                        .filter(appt => showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status))
                                        .map(appt => (
                                            <AppointmentCard
                                                key={appt.id}
                                                appt={appt}
                                                onClick={() => onSlotClick(slot.time.getHours(), appt)}
                                            />
                                        ))}

                                    {!isBlocked && (
                                        <div
                                            className={`available-slot ${isSlotClosed ? 'available-slot--closed' : ''}`}
                                            onClick={() => handleSlotAction(slot)}
                                        >
                                            <span className="available-slot__icon">{isSlotClosed ? '🚫' : '+'}</span>
                                            <div className="available-slot__info">
                                                <span className="available-slot__time">
                                                    {slot.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="available-slot__label">
                                                    {isSlotClosed ? (t('closed_hours') || 'Fuera de Horario') : (t('available') || 'Disponible')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default DaySchedule;
