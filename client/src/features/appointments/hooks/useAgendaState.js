import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNow, parseDate } from '@/utils/core/dateUtils';

/**
 * useAgendaState
 * Manages the navigation and filtering state of the agenda.
 */
export const useAgendaState = (setViewDoctorId) => {
    const location = useLocation();
    const navigate = useNavigate();

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;
    const initialDoctorId = rescheduleAppt?.doctor_id || syncAppt?.doctor_id || location.state?.viewDoctorId;

    const [selectedDate, setSelectedDate] = useState(() => {
        if (syncAppt) return parseDate(syncAppt.appointment_date);
        return location.state?.selectedDate ? parseDate(location.state.selectedDate) : getNow();
    });
    const [showOutOfHours, setShowOutOfHours] = useState(true);

    const exitRescheduleMode = useCallback(() => 
        navigate(location.pathname, { replace: true, state: {} }), 
    [navigate, location.pathname]);

    // Handle initial state sync from router (reschedule/sync/direct navigation)
    useEffect(() => {
        if (initialDoctorId) {
            queueMicrotask(() => {
                setViewDoctorId(String(initialDoctorId));
            });
        }

        if (location.state?.selectedDate) {
            queueMicrotask(() => {
                setSelectedDate(prev => {
                    const target = parseDate(location.state.selectedDate);
                    return prev.getTime() === target.getTime() ? prev : target;
                });
            });
        }
    }, [initialDoctorId, location.state?.selectedDate, setViewDoctorId]);

    return {
        selectedDate,
        setSelectedDate,
        showOutOfHours,
        setShowOutOfHours,
        rescheduleAppt,
        syncAppt,
        exitRescheduleMode
    };
};
